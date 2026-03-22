import { createClient } from "@/lib/supabase/server";
import FeedHome from "@/components/FeedHome";
import HomeLanding from "@/components/HomeLanding";
import MockHomeEntry from "@/components/MockHomeEntry";

export default async function HomePage() {
  if (process.env.NEXT_PUBLIC_DATA_MODE !== "real") {
    return <MockHomeEntry />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <HomeLanding />;
  }

  return <FeedHome />;
}
