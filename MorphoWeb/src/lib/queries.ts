"use server";

import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import { redirect } from "next/navigation";
import { SIGN_IN, SUBACCOUNT_USER } from "./constants";
import {
  agency,
  invitation_role,
  lane,
  Prisma,
  subaccount,
  subscription,
  tag,
  ticket,
  user,
} from "@prisma/client";
import {v4 as uuid, v4} from "uuid";
import {
  CreateFunnelFormSchema,
  CreateMediaType,
  UpsertFunnelPage,
} from "./types";
import { z } from "zod";
import { revalidatePath } from "next/cache";

/**
 * A function that check if the user exists with email or not?
 * @returns userDate
 */
// export const getAuthUserDetails = async () => {
//   const user = await currentUser();
//   if (!user) {
//     return;
//   }

//   const userData = await db.user.findUnique({
//     where: {
//       email: user.emailAddresses[0].emailAddress,
//     },
//     include: {
//       Agency: {
//         include: {
//           SidebarOption: true,
//           SubAccount: {
//             include: {
//               SidebarOption: true,
//             },
//           },
//         },
//       },
//       Permissions: true,
//     },
//   });

//   return userData;
// };

export const getAuthUserDetails = async () => {
  const user = await currentUser();
  if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
    console.error("User is not logged in or email address is missing.");
    return null;
  }

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) {
    console.error("Email address is undefined.");
    return null;
  }

  try {
    const userData = await db.user.findUnique({
      where: {
        email: email,
      },
      // include: {
      //   agency: {
      //     include: {
      //       // SidebarOption: true, // Removed as it is not a valid property
      //       // SubAccount property removed as it is not valid in agencyInclude type
      //     },
      //   },
      //   // Permissions: true, // Removed as it is not a valid property
      // },
      include: {
        agency: {
          include: {
            sidebarOptions: true,
            subaccounts: {
              include: {
                sidebarOptions: true,
              },
            },
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },    
      },  
      
    });

    if (!userData) {
      console.error(`No user found with email: ${email}`);
      return null;
    }

    return userData;
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
}; 

export const saveActivityLogsNotification = async ({
  agencyId,
  description,
  subaccountId,
}: {
  agencyId?: string;
  description: string;
  subaccountId?: string;
}) => {
  const authUser = await currentUser();

  let userData;

  if (!authUser) {
    const response = await db.user.findFirst({
      where: {
        agency: {
          // // subAccount: {
          //   some: { id: subaccountId },
          // },
        },
      },
    });

    if (response) {
      userData = response;
    }
  } else {
    userData = await db.user.findUnique({
      where: {
        email: authUser?.emailAddresses[0].emailAddress,
      },
    });
  }

  if (!userData) {
    console.error("Could not find a user data");
    return;
  }

  let foundAgencyId = agencyId;

  if (!foundAgencyId) {
    if (!subaccountId) {
      throw new Error(
        "You need to provide at least an agency ID for subacount ID"
      );
    }

    const response = await db.subaccount.findUnique({
      where: { id: subaccountId },
    });

    if (response) foundAgencyId = response.agencyId;
  }

  if (subaccountId) {
    await db.notification.create({
      data: {
        notification: `${userData.name} | ${description}`,
        user: {
          connect: {
            id: userData.id,
          },
        },
        agency: {
          connect: {
            id: foundAgencyId,
          },
        },
        // subAccountId: {
        //   connect: {
        //     id: subaccountId,
        //   },
        // },
        subAccountId: subaccountId,
      },
    });
  } else {
    await db.notification.create({
      data: {
        notification: `${userData.name} | ${description}`,
        updatedAt: new Date(),
        user: {
          connect: {
            id: userData.id,
          },
        },
        agency: {
          connect: {
            id: foundAgencyId,
          },
        },
        ...(subaccountId && { subAccountId: subaccountId }),
      },
    });
  }
};

/**
 * Creates a new Team user
 * @param agencyId From Prisma Agency Table
 * @param user From Prisma client
 * @returns Response If user is created or not.
 */
export const createTeamUser = async (agencyId: string, user: user) => {
  if (user.role === "AGENCY_OWNER") return null;

  const response = await db.user.create({ data: { ...user } });
  return response;
};

export const verifyAndAcceptInvitation = async () => {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");
  
  const invitationExists = await db.invitation.findUnique({
    where: {
      email: user.emailAddresses[0].emailAddress,
      status: "PENDING",
    },
  });

  console.log("invite subAccountID >", invitationExists?.subAccountId);

  if (invitationExists) {
    const userDetails = await createTeamUser(invitationExists.agencyId, {
      email: invitationExists.email,
      agencyId: invitationExists.agencyId,
      avatarUrl: user.imageUrl,
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      role: invitationExists.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    if (invitationExists.subAccountId) {
      const permission = await db.permissions.upsert({
        where: {
          email_subAccountId: {
            email: invitationExists.email,
            subAccountId: invitationExists.subAccountId,
          },
        },
        update: {
          access: true,
        },
        create: {
          email: invitationExists.email,
          subAccountId: invitationExists.subAccountId,
          access: true,
        },
      });

      await db.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId: user.id,
            permissionId: permission.id,
          },
        },
        create: {
          userId: user.id,
          permissionId: permission.id,
        },
        update: {},
      });  
    }
    await saveActivityLogsNotification({
      agencyId: invitationExists?.agencyId,
      description: `Joined`,
      subaccountId: undefined,
    });

    if (userDetails) {
      await clerkClient.users.updateUserMetadata(user.id, {
        privateMetadata: {
          role: userDetails.role || "SUBACCOUNT_USER",
        },
      });

      await db.invitation.delete({
        where: { email: userDetails.email },
      });

      return userDetails.agencyId;
    } else return null;
  } else {
    const agency = await db.user.findUnique({
      where: {
        email: user.emailAddresses[0].emailAddress,
      },
    });

    return agency ? agency.agencyId : null;
  }
};

export const updateAgencyDetails = async (
  agencyId: string,
  agencyDetails: Partial<agency>
) => {
  const response = await db.agency.update({
    where: { id: agencyId },
    data: { ...agencyDetails },
  });
  return response;
};

export const deleteAgency = async (agencyId: string) => {
  const response = await db.agency.delete({ where: { id: agencyId } });
  return response;
};

export const initUser = async (newUser: Partial<user>) => {
  const user = await currentUser();

  if (!user) return;

  const userData = await db.user.upsert({
    where: { email: user.emailAddresses[0].emailAddress },
    update: newUser,
    create: {
      id: user.id,
      avatarUrl: user.imageUrl,
      email: user.emailAddresses[0].emailAddress,
      name: `${user.firstName} ${user.lastName}`,
      role: newUser.role || "SUBACCOUNT_USER",
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  await clerkClient.users.updateUserMetadata(user.id, {
    privateMetadata: {
      role: newUser.role || SUBACCOUNT_USER,
    },
  });

  return userData;
};

// export const upsertAgency = async (agency: agency, price?: subscription_plan) => {
//   if (!agency.companyEmail) return null;
//   try {
//     const agencyDetails = await db.agency.upsert({
//       where: {
//         id: agency.id,
//       },
//       update: agency,
//       create: {
//         users: {
//           connect: { email: agency.companyEmail },
//         },
//         ...agency,
//         SidebarOption: {
//           create: [
//             {
//               name: "Dashboard",
//               icon: "category",
//               link: `/agency/${agency.id}`,
//             },
//             {
//               name: "Launchpad",
//               icon: "clipboardIcon",
//               link: `/agency/${agency.id}/launchpad`,
//             },
//             {
//               name: "Billing",
//               icon: "payment",
//               link: `/agency/${agency.id}/billing`,
//             },
//             {
//               name: "Settings",
//               icon: "settings",
//               link: `/agency/${agency.id}/settings`,
//             },
//             {
//               name: "Sub Accounts",
//               icon: "person",
//               link: `/agency/${agency.id}/all-subaccounts`,
//             },
//             {
//               name: "Team",
//               icon: "shield",
//               link: `/agency/${agency.id}/team`,
//             },
//           ],
//         },
//       },
//     });
//     return agencyDetails;
//   } catch (error) {
//     console.log(error);
//   }
// };

// export const upsertAgency = async (agency: agency, price?: subscription_plan) => {
//   if (!agency.companyEmail) return null;
//   try {
//     const agencyDetails = await db.agency.upsert({
//       where: {
//         id: agency.id,
//       },
//       update: {
//         ...agency,
//         connectedAccountId: agency.connectedAccountId || "", // Ensure the correct field name is used
//       },
//       create: {
//         users: {
//           connect: { email: agency.companyEmail },
//         },
//         ...agency,
//         connectedAccountId: agency.connectedAccountId || "", // Ensure the correct field name is used
//         sidebarOptions: {
//           create: [
//             {
//               id: v4(), // Generate a unique ID
//               name: "Dashboard",
//               icon: "category",
//               link: `/agency/${agency.id}`,
//               updatedAt: new Date(), // Set the current date and time
//             },
//             {
//               id: v4(), // Generate a unique ID
//               name: "Launchpad",
//               icon: "clipboardIcon",
//               link: `/agency/${agency.id}/launchpad`,
//               updatedAt: new Date(), // Set the current date and time
//             },
//             {
//               id: v4(), // Generate a unique ID
//               name: "Billing",
//               icon: "payment",
//               link: `/agency/${agency.id}/billing`,
//               updatedAt: new Date(), // Set the current date and time
//             },
//             {
//               id: v4(),
//               name: "Settings",
//               icon: "settings",
//               link: `/agency/${agency.id}/settings`,
//             },
//             {
            
//               name: "Sub Accounts",
//               icon: "person",
//               link: `/agency/${agency.id}/all-subaccounts`,
//             },
//             {
//               name: "Team",
//               icon: "shield",
//               link: `/agency/${agency.id}/team`,
//             },
//           ],
//         },
//       },
//     });
//     return agencyDetails;
//   } catch (error) {
//     console.log("Error in upsertAgency:", error);
//     throw error;
//   }
// };

export const upsertAgency = async (agency: agency, price?: subscription) => {
  if (!agency.companyEmail) return null;

  try {
    const agencyDetails = await db.agency.upsert({
      where: {
        id: agency.id,
      },
      update: {
        id: agency.id,
        connectedAccountId: agency.connectedAccountId || "",
        customerId: agency.customerId,
        name: agency.name,
        agencyLogo: agency.agencyLogo,
        companyEmail: agency.companyEmail,
        companyPhone: agency.companyPhone,
        whiteLabel: agency.whiteLabel,
        address: agency.address,
        city: agency.city,
        zipCode: agency.zipCode,
        state: agency.state,
        country: agency.country,
        goal: agency.goal,
        updatedAt: new Date(), // Explicitly set updatedAt
      },
      create: {
        id: agency.id,
        connectedAccountId: agency.connectedAccountId || "",
        customerId: agency.customerId,
        name: agency.name,
        agencyLogo: agency.agencyLogo,
        companyEmail: agency.companyEmail,
        companyPhone: agency.companyPhone,
        whiteLabel: agency.whiteLabel,
        address: agency.address,
        city: agency.city,
        zipCode: agency.zipCode,
        state: agency.state,
        country: agency.country,
        goal: agency.goal,
        createdAt: new Date(), // Explicitly set createdAt
        updatedAt: new Date(), // Explicitly set updatedAt
        users: {
          connect: { email: agency.companyEmail },
        },
        sidebarOptions: {
          create: [
            {
              id: uuid(),
              name: "Dashboard",
              icon: "category",
              link: `/agency/${agency.id}`,
              updatedAt: new Date(),
            },
            {
              id: uuid(),
              name: "Launchpad",
              icon: "clipboardIcon",
              link: `/agency/${agency.id}/launchpad`,
              updatedAt: new Date(),
            },
            {
              id: uuid(),
              name: "Billing",
              icon: "payment",
              link: `/agency/${agency.id}/billing`,
              updatedAt: new Date(),
            },
            {
              id: uuid(),
              name: "Settings",
              icon: "settings",
              link: `/agency/${agency.id}/settings`,
              updatedAt: new Date(),
            },
            {
              id: uuid(),
              name: "Sub Accounts",
              icon: "person",
              link: `/agency/${agency.id}/all-subaccounts`,
              updatedAt: new Date(),
            },
            {
              id: uuid(),
              name: "Team",
              icon: "shield",
              link: `/agency/${agency.id}/team`,
              updatedAt: new Date(),
            },
          ],
        },
      },
    });
    return agencyDetails;
  } catch (error) {
    console.log("Error in upsertAgency:", error);
    throw error;
  }
};

export const getNotificationAndUser = async (agencyId: string) => {
  try {
    const response = await db.notification.findMany({
      where: { agencyId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    return response;
  } catch (error) {
    console.error(error);
  }
};

export const upsertSubAccount = async (subAccount: subaccount) => {
  if (!subAccount.companyEmail) return null;

  const agencyOwner = await db.user.findFirst({
    where: { agency: { id: subAccount.agencyId }, role: "AGENCY_OWNER" },
  });

  if (!agencyOwner)
    return console.error("🔴 Error: Could not create a Sub-Account");

  const permissionId = v4();

  const subId = subAccount.id || uuid();
  subAccount.id ??= subId;

  const now = new Date();

  const response = await db.subaccount.upsert({
    where: { id: subId },
    update: subAccount,
    create: {
      ...subAccount,
      updatedAt: now,
      Permissions: {
        connectOrCreate: {
          where: {id: permissionId},
          create: {
            id: permissionId,
            access: true,
            email: agencyOwner.email,
            // subAccountId: subId,
          },
          
        },
        // connect: {
        //   subAccountId: subAccount.id,
        //   id: permissionId,
        // },
      },
      pipelines: {
        create: { name: "Lead Cycle" },
      },
      sidebarOptions: {
        create: [
          {
            name: "Launchpad",
            icon: "clipboardIcon",
            link: `/subaccount/${subAccount.id}/launchpad`,
            id: "",
            updatedAt: ""
          },
          {
            name: "Settings",
            icon: "settings",
            link: `/subaccount/${subAccount.id}/settings`,
            id: "",
            updatedAt: ""
          },
          {
            name: "Funnels",
            icon: "pipelines",
            link: `/subaccount/${subAccount.id}/funnels`,
            id: "",
            updatedAt: ""
          },
          {
            id: uuid(),
            name: "Media",
            icon: "database",
            link: `/subaccount/${subAccount.id}/media`,
            updatedAt: new Date(),
          },
          {
            name: "Automations",
            icon: "chip",
            link: `/subaccount/${subAccount.id}/automations`,
            id: "",
            updatedAt: ""
          },
          {
            id: uuid(),
            name: "Pipelines",
            icon: "flag",
            link: `/subaccount/${subAccount.id}/pipelines`,
            updatedAt: new Date(),
          },
          {
            name: "Contacts",
            icon: "person",
            link: `/subaccount/${subAccount.id}/contacts`,
            id: "",
            updatedAt: ""
          },
          {
            name: "Dashboard",
            icon: "category",
            link: `/subaccount/${subAccount.id}`,
            id: "",
            updatedAt: ""
          },
        ],
      },
    },
  });

  return response;
};

export const getUserPermissions = async (userId: string) => {
  const response = await db.user.findUnique({
    where: { id: userId },
    include: { permissions: { 
      include: {
        permission: {
          include: { subaccount: true }
        }
      } 
    }
  },
  });

  return response;
};

export const updateUser = async (user: Partial<user>) => {
  const response = await db.user.update({
    where: {
      email: user.email,
    },
    data: { ...user },
  });

  await clerkClient.users.updateUserMetadata(response.id, {
    privateMetadata: { role: user.role || SUBACCOUNT_USER },
  });

  return response;
};

export const changeUserPermissions = async (
  permissionId: string | undefined,
  userEmail: string,
  subAccountId: string,
  permission: boolean
) => {
  try {
    const response = await db.permissions.upsert({
      where: { id: permissionId },
      update: { access: permission },
      create: {
        id: v4(),
        access: permission,
        email: userEmail,
        subAccountId: subAccountId,
      },
    });
    return response;
  } catch (error) {
    console.log("🔴 Error: Couldn't change persmission", error);
  }
};

export const getSubaccountDetails = async (subAccountId: string) => {
  try {
    const response = await db.subaccount.findFirst({
      where: { id: subAccountId },
    });

    return response;
  } catch (error) {
    console.log("🔴 Error: Couldn't find sub account details.", error);
  }
};

export const deleteSubAccount = async (subAccountId: string) => {
  try {
    const response = await db.subaccount.delete({
      where: { id: subAccountId },
    });

    return response;
  } catch (error) {
    console.log("🔴 Error: Couldn't delete sub account.", error);
  }
};

export const deleteUser = async (userId: string) => {
  await clerkClient.users.updateUserMetadata(userId, {
    privateMetadata: {
      role: undefined,
    },
  });
  const deletedUser = await db.user.delete({ where: { id: userId } });

  return deletedUser;
};

export const getUser = async (id: string) => {
  const user = await db.user.findUnique({
    where: {
      id,
    },
  });

  return user;
};

export const sendInvitation = async (
  role: invitation_role,
  email: string,
  agencyId: string,
  subAccountId: string
) => {
  try {
    const existingUser = await db.user.findUnique({where: {email}});
    if (existingUser) {
      throw new Error("A user with this email already has an account.")
    }
    // Create an invitation in your database
    // const response = await db.invitation.create({
    //   data: { id: uuid(), email, agencyId, role },
    // });

    const response = await db.invitation.upsert({
      where: {email},
      update: {
        role,
        status: "PENDING",
        subAccountId,
        // updatedAt: new Date(),
      },
      create: {
        id: uuid(),
        email,
        agencyId,
        role,
        subAccountId,
        status: "PENDING",
      },
      
    });

    // Create an invitation using Clerk
    await clerkClient.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: process.env.NEXT_PUBLIC_URL,
      publicMetadata: {
        throughInvitation: true,
        role,
      },
    });

    // If Clerk invitation is successful, return the database response
    return response;
  } catch (err: any) {
    console.log("Error sending invitation:", err);
    console.error("Error sending invitation:",err);
    throw new Error(
      err?.errors?.[0]?.message??
      "Failed to send Clerk invitation. Check Clerk settings."
    );
  }
};

export const createMedia = async (
  subAccountId: string,
  mediaFiles: CreateMediaType
) => {
  const response = await db.media.create({
    data: {
      id: v4(),
      type: mediaFiles.type,
      link: mediaFiles.link,
      name: mediaFiles.name,
      subAccountId: subAccountId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  return response;
};




export const getMedia = async (subaccountId: string) => {
  const mediaFiles = await db.subaccount.findUnique({
    where: {
      id: subaccountId,
    },
    include: {
      media: true,
    },
  });

  return mediaFiles;
};

export const deleteMedia = async (mediaId: string) => {
  const response = await db.media.delete({
    where: {
      id: mediaId,
    },
  });
  return response;
};

export const getPipelineDetails = async (pipelineId: string) => {
  const response = await db.pipeline.findUnique({
    where: { id: pipelineId },
  });

  return response;
};

export const getLanesWithTicketAndTags = async (pipelineId: string) => {
  const response = await db.lane.findMany({
    where: {
      pipelineId,
    },
    orderBy: { order: "asc" },
    include: {
      ticket: {
        orderBy: {
          order: "asc",
        },
        include: {
          tags: true,
          assigned: true,
          customer: true,
        },
      },
    },
  });
  return response;
};

export const upsertFunnel = async (
  subaccountId: string,
  funnel: z.infer<typeof CreateFunnelFormSchema> & { liveProducts: string },
  funnelId: string
) => {
  const response = await db.funnel.upsert({
    where: { id: funnelId },
    update: funnel,
    create: {
      ...funnel,
      // id: funnelId || v4(),
      subAccountId: subaccountId,
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  return response;
};

export const upsertPipeline = async (
  pipeline: Prisma.pipelineUncheckedCreateInput
) => {
  const response = await db.pipeline.upsert({
    where: { id: pipeline.id || v4() },
    update: pipeline,
    create: pipeline,
  });

  return response;
};

export const deletePipeline = async (pipelineId: string) => {
  const response = await db.pipeline.delete({
    where: { id: pipelineId },
  });
  return response;
};

export const updateLanesOrder = async (lanes: lane[]) => {
  try {
    const updateTrans = lanes.map((lane) =>
      db.lane.update({
        where: { id: lane.id },
        data: { order: lane.order },
      })
    );

    await db.$transaction(updateTrans);
    console.log("🟢 Reordered Lane Successfully 🟢");
  } catch (error: any) {
    console.error("🔴 Failed while Reordering Lane 🔴", error.message);
  }
};

export const updateTicketsOrder = async (tickets: ticket[]) => {
  try {
    const updateTrans = tickets.map((ticket) =>
      db.ticket.update({
        where: { id: ticket.id },
        data: {
          order: ticket.order,
          laneId: ticket.laneId,
        },
      })
    );

    await db.$transaction(updateTrans);
    console.log("🟢 Reordered Tickets Successfully 🟢");
  } catch (error: any) {
    console.error("🔴 Failed while Reordering Ticket 🔴", error.message);
  }
};

export const upsertLane = async (lane: Prisma.laneUncheckedCreateInput) => {
  let order: number;

  if (!lane.order) {
    const lanes = await db.lane.findMany({
      where: {
        pipelineId: lane.pipelineId,
      },
    });

    order = lanes.length;
  } else {
    order = lane.order;
  }

  const response = await db.lane.upsert({
    where: { id: lane.id || v4() },
    update: lane,
    create: { ...lane, order },
  });

  return response;
};

export const deleteLane = async (laneId: string) => {
  const response = await db.lane.delete({ where: { id: laneId } });

  return response;
};

export const getTicketsWithTags = async (pipelineId: string) => {
  const response = await db.ticket.findMany({
    where: {
      lane: {
        pipelineId: pipelineId,
      },
    },
    include: {
      tags: true,
      assigned: true,
      customer: true,
    },
  });

  return response;
};

export const getSubAccountTeamMembers = async (subAccountId: string) => {
  const subAccountUserWithAccess = await db.user.findMany({
    where: {
      agency: {
        subaccounts: {
          some: {
            id: subAccountId,
          },
        },
      },
      role: "SUBACCOUNT_USER",
      permissions: {
        some: {
          permission: {
            subAccountId: subAccountId,
            access: true,
          },
          
        },
      },
    },
  });

  return subAccountUserWithAccess;
};

export const searchContacts = async (searchTerms: string) => {
  const response = await db.contact.findMany({
    where: {
      name: {
        contains: searchTerms,
      },
    },
  });

  return response;
};

export const upsertTicket = async (
  ticket: Prisma.ticketUncheckedCreateInput,
  tags: tag[]
) => {
  let order: number;

  if (!ticket.order) {
    const tickets = await db.ticket.findMany({
      where: {
        laneId: ticket.laneId,
      },
    });
    order = tickets.length;
  } else {
    order = ticket.order;
  }

  const response = await db.ticket.upsert({
    where: { id: ticket.id || v4() },
    update: { ...ticket, tags: { set: tags } },
    create: { ...ticket, tags: { connect: tags }, order },
    include: {
      assigned: true,
      customer: true,
      tags: true,
      lane: true,
    },
  });

  return response;
};

export const _getTicketsWithAllRelations = async (laneId: string) => {
  const response = await db.ticket.findMany({
    where: { laneId: laneId },
    include: {
      assigned: true,
      customer: true,
      lane: true,
      tags: true,
    },
  });

  return response;
};

export const deleteTicket = async (ticketId: string) => {
  const response = await db.ticket.delete({
    where: {
      id: ticketId,
    },
  });

  return response;
};

export const deleteTag = async (tagId: string) => {
  const response = await db.tag.delete({ where: { id: tagId } });
  return response;
};

export const getTagsForSubaccount = async (subaccountId: string) => {
  const response = await db.subaccount.findUnique({
    where: { id: subaccountId },
    include: { tags: true },
  });
  return response;
};

export const upsertTag = async (
  subaccountId: string,
  tag: Prisma.tagUncheckedCreateInput
) => {
  const response = await db.tag.upsert({
    where: { id: tag.id || v4(), subAccountId: subaccountId },
    update: tag,
    create: { ...tag, subAccountId: subaccountId },
  });

  return response;
};

export const upsertContact = async (
  contact: Prisma.contactUncheckedCreateInput
) => {
  const response = await db.contact.upsert({
    where: { id: contact.id || v4() },
    update: contact,
    create: contact,
  });

  return response;
};

export const getFunnels = async (subacountId: string) => {
  const funnels = await db.funnel.findMany({
    where: { subAccountId: subacountId },
    include: { pages: true },
  });

  return funnels;
};

export const getFunnel = async (funnelId: string) => {
  const funnel = await db.funnel.findUnique({
    where: { id: funnelId },
    include: {
      pages: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  return funnel;
};

export const updateFunnelProducts = async (
  products: string,
  funnelId: string
) => {
  const data = await db.funnel.update({
    where: { id: funnelId },
    data: { liveProducts: products },
  });
  return data;
};

export const upsertFunnelPage = async (
  subaccountId: string,
  funnelPage: UpsertFunnelPage,
  funnelId: string
) => {
  if (!subaccountId || !funnelId) return;
  const response = await db.funnelpage.upsert({
    where: { id: funnelPage.id || "" },
    update: { ...funnelPage },
    create: {
      ...funnelPage,
      content: funnelPage.content
        ? funnelPage.content
        : JSON.stringify([
            {
              content: [],
              id: "__body",
              name: "Body",
              styles: { backgroundColor: "white" },
              type: "__body",
            },
          ]),
      funnelId,
    },
  });

  revalidatePath(`/subaccount/${subaccountId}/funnels/${funnelId}`, "page");
  return response;
};

export const deleteFunnelePage = async (funnelPageId: string) => {
  const response = await db.funnelpage.delete({ where: { id: funnelPageId } });

  return response;
};

export const getFunnelPageDetails = async (funnelPageId: string) => {
  const response = await db.funnelpage.findUnique({
    where: {
      id: funnelPageId,
    },
  });

  return response;
};

export const getDomainContent = async (subDomainName: string) => {
  const response = await db.funnel.findUnique({
    where: { subDomainName },
    include: { pages: true },
  });

  return response;
};

export const getPipelines = async (subaccountId: string) => {
  const response = await db.pipeline.findMany({
    where: { subAccountId: subaccountId },
    include: {
      lanes: {
        include: { ticket: true },
      },
    },
  });
  return response;
};


