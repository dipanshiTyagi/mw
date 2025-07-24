import Unauthorized from "@/components/unauthorized";
import { SUBACCOUNT_SLUG } from "@/lib/constants";
import { getAuthUserDetails, verifyAndAcceptInvitation } from "@/lib/queries";
import { redirect } from "next/navigation";

type Props = {
  searchParams: { state: string; code: string };
};

const SubAccountPage = async ({ searchParams }: Props) => {
  const agencyId = await verifyAndAcceptInvitation();
  console.log("agencyId:", agencyId);

  if (!agencyId) {
    return <Unauthorized />;
  }

  const user = await getAuthUserDetails();
  console.log("user:", user);
  if (!user) return;

  const first = user.permissions.find(
    (per) => per.permission.access === true);

  console.log("first:", first);

  const getFirstSubaccountWithAccess = user.permissions.find(
    (per) => per.permission.access === true
  );

  if (searchParams.state) {
    const statePath = searchParams.state.split("___")[0];
    const stateSubaccountId = searchParams.state.split("___")[1];
    if (!stateSubaccountId) return <Unauthorized />;
    return redirect(
      `${SUBACCOUNT_SLUG}/${stateSubaccountId}/${statePath}?code=${searchParams.code}`
    );
  }

  if (getFirstSubaccountWithAccess) {
    return redirect(
      `${SUBACCOUNT_SLUG}/${getFirstSubaccountWithAccess.permission.subAccountId}`
    );
  }
//   console.log("state:", searchParams.state);
// console.log("parsed:", statePath, stateSubaccountId);

  return <Unauthorized />;
};

export default SubAccountPage;
