import { SellerProfileView } from "@/components/account/AccountViews";
import { RequireAuth } from "@/components/auth/RequireAuth";
export default function Page() {
  return (
    <RequireAuth>
      <SellerProfileView />
    </RequireAuth>
  );
}
