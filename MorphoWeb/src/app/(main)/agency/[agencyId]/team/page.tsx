import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import React from "react";
import DataTable from "./_components/data-table";
import { Plus } from "lucide-react";
import { columns } from "./_components/columns";
import SendInvitation from "@/components/forms/send-invitation";

type Props = {
  params: { agencyId: string };
};

const TeamPage = async ({ params }: Props) => {
  const authUser = await currentUser();
  if (!authUser) return null;

  const agencyDetails = await db.agency.findUnique({
    where: { id: params.agencyId },
    include: { subaccounts: true },
  });

  if (!agencyDetails) return;

  const teamMembers = await db.user.findMany({
    where: { agency: { id: params.agencyId } },
    include: {
      agency: { include: { subaccounts: true } },
      permissions: { include: {
        permission: {
          include: {
            subaccount: true,
          },
        },
      } },
    },
  });

  return (
    <DataTable
      acctionButtonText={
        <>
          <Plus size={15} /> Add
        </>
      }
      modalChildren={<SendInvitation agencyId={agencyDetails.id} />}
      filterValue="name"
      columns={columns}
      data={teamMembers}
    ></DataTable>
  );
};

export default TeamPage;
