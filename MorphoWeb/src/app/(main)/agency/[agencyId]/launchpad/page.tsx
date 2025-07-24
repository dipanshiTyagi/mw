import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AGENCY_SLUG } from "@/lib/constants";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getStripeOAuthLink } from "@/lib/utils";
import { CheckCircleIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

type Props = {
  params: {
    agencyId: string;
  };

  searchParams: { code: string; skip?: string };
};

const LaunchPadPage = async ({ params, searchParams }: Props) => {
  const agencyDetails = await db.agency.findUnique({
    where: { id: params.agencyId },
  });

  if (!agencyDetails) return null;

  const allDetailsExist =
    agencyDetails.address &&
    agencyDetails.agencyLogo &&
    agencyDetails.city &&
    agencyDetails.companyEmail &&
    agencyDetails.companyPhone &&
    agencyDetails.country &&
    agencyDetails.name &&
    agencyDetails.state &&
    agencyDetails.zipCode;

 const showStripeCard = agencyDetails.country === "IN";

  const stripeOAuthLink = getStripeOAuthLink(
    "agency",
    `launchpad___${agencyDetails.id}`
  );

  let connectedStripeAccount = false;

  if (searchParams.code) {
    if (!agencyDetails.connectedAccountId) {
      try {
        const response = await stripe.oauth.token({
          grant_type: "authorization_code",
          code: searchParams.code,
        });

        await db.agency.update({
          where: { id: params.agencyId },
          data: { connectedAccountId: response.stripe_user_id },
        });

        connectedStripeAccount = true;
      } catch (error) {
        console.error("🔴 Could not connect stripe account");
      }
    }
  }

  // const razorpayOAuthLink = getStripeOAuthLink(
  //   "agency",
  //   `launchpad___${agencyDetails.id}`,
  // );
  
  // let connectedRazorpayAccount = false;

  // if (searchParams.code){
  //   if (!agencyDetails.connectedAccountId) {
  //     try {
  //       const {body} = await razorpay.utils.postRequest({
  //         url: `/oauth/token`,
  //         data: {
  //           grant_type: "authorization_code",
  //           code: searchParams.code,
  //         },
  //       });

  //       await db.agency.update({
  //         where: { id: params.agencyId },
  //         data: { connectedAccountId: body.razorpay_user_id },
  //       });
  //       connectedRazorpayAccount = true;
  //     }catch (error) 
  //   }
  // }

  // return (
  //   <div className="flex flex-col justify-center items-center">
  //     <div className="w-full h-full max-w-[800px]">
  //       <Card className="border-none">
  //         <CardHeader>
  //           <CardTitle>Lets get started!</CardTitle>
  //           <CardDescription>
  //             Follow the steps below to get your account setup.
  //           </CardDescription>
  //         </CardHeader>

  //         <CardContent className="flex flex-col gap-4">
  //           <div className="flex justify-between items-center w-full border p-4 rounded-lg gap-2">
  //             <div className="flex md:items-center gap-4 flex-col md:!flex-row">
  //               <Image
  //                 src="/appstore.png"
  //                 alt="app logo"
  //                 height={80}
  //                 width={80}
  //                 className="rounded-md object-contain"
  //               />
  //               <p>Save the website as a shortcut on your mobile device</p>
  //             </div>
  //             <Button className=" hover:bg-primary/80">Start</Button>
  //           </div>

  //           <div className="flex justify-between items-center w-full border p-4 rounded-lg gap-2">
  //             <div className="flex md:items-center gap-4 flex-col md:!flex-row">
  //               <Image
  //                 src="/stripelogo.png"
  //                 alt="app logo"
  //                 height={80}
  //                 width={80}
  //                 className="rounded-md object-contain"
  //               />
  //               <p>
  //                 {" "}
  //                 Connet your stripe account to accept payments and see your
  //                 dashboard.
  //               </p>
  //             </div>
  //             {agencyDetails.connectedAccountId || connectedStripeAccount ? (
  //               <CheckCircleIcon
  //                 size={50}
  //                 className="text-primary p-2 flex-shrink-0"
  //               />
  //             ) : (
  //               <Link
  //                 href={stripeOAuthLink}
  //                 className="bg-primary py-2 px-4 rounded-md hover:bg-primary/80"
  //               >
  //                 Start
  //               </Link>
  //             )}
  //           </div>

  //           <div className="flex justify-between items-center w-full border p-4 rounded-lg gap-2">
  //             <div className="flex md:items-center gap-4 flex-col md:!flex-row">
  //               <Image
  //                 src={agencyDetails.agencyLogo}
  //                 alt="app logo"
  //                 height={80}
  //                 width={80}
  //                 className="rounded-md object-contain"
  //               />
  //               <p> Fill in all your bussiness details</p>
  //             </div>
  //             {allDetailsExist ? (
  //               <CheckCircleIcon
  //                 size={50}
  //                 className="text-primary p-2 flex-shrink-0"
  //               />
  //             ) : (
  //               <Link
  //                 className="bg-primary py-2 px-4 rounded-md  hover:bg-primary/80"
  //                 href={`${AGENCY_SLUG}/${params.agencyId}/settings`}
  //               >
  //                 Start
  //               </Link>
  //             )}
  //           </div>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   </div>
  // );

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="h-full w-full max-w-[800px]">
        <Card className="border-none">
          <CardHeader>
            <CardTitle>Let’s get started!</CardTitle>
            <CardDescription>
              Follow the steps below to finish setting up your account.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {/* 1️⃣  Save‑shortcut card */}
            <div className="flex w-full items-center justify-between gap-2 rounded-lg border p-4">
              <div className="flex flex-col gap-4 md:!flex-row md:items-center">
                <Image
                  src="/appstore.png"
                  alt="app logo"
                  height={80}
                  width={80}
                  className="object-contain rounded-md"
                />
                <p>Save the website as a shortcut on your mobile device</p>
              </div>
              <Button className="hover:bg-primary/80">Start</Button>
            </div>

            {/* 2️⃣  Stripe Connect card – only if showStripeCard is true */}
            {showStripeCard && (
              <div className="flex w-full items-center justify-between gap-2 rounded-lg border p-4">
                <div className="flex flex-col gap-4 md:!flex-row md:items-center">
                  <Image
                    src="/stripelogo.png"
                    alt="Stripe logo"
                    height={80}
                    width={80}
                    className="object-contain rounded-md"
                  />
                  <p>
                    Connect your Stripe account to accept payments and view your
                    payouts dashboard.
                  </p>
                </div>
                {agencyDetails.connectedAccountId || connectedStripeAccount ? (
                  <CheckCircleIcon
                    size={50}
                    className="flex-shrink-0 p-2 text-primary"
                  />
                ) : (
                  <Link
                    href={stripeOAuthLink}
                    className="rounded-md bg-primary py-2 px-4 hover:bg-primary/80"
                  >
                    Start
                  </Link>
                )}
              </div>
            )}

            {/* 3️⃣  Business‑details card */}
            <div className="flex w-full items-center justify-between gap-2 rounded-lg border p-4">
              <div className="flex flex-col gap-4 md:!flex-row md:items-center">
                <Image
                  src={agencyDetails.agencyLogo}
                  alt="Agency logo"
                  height={80}
                  width={80}
                  className="object-contain rounded-md"
                />
                <p>Fill in all your business details</p>
              </div>
              {allDetailsExist ? (
                <CheckCircleIcon
                  size={50}
                  className="flex-shrink-0 p-2 text-primary"
                />
              ) : (
                <Link
                  className="rounded-md bg-primary py-2 px-4 hover:bg-primary/80"
                  href={`${AGENCY_SLUG}/${params.agencyId}/settings`}
                >
                  Start
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LaunchPadPage;
