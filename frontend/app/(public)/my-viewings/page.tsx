import { MyViewings } from "@/components/account/AccountViews";
import { RequireAuth } from "@/components/auth/RequireAuth";
export default function Page() {
  return (
    <RequireAuth>
      <MyViewings />
    </RequireAuth>
  );
}
