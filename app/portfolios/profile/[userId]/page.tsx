import { CommunityProfileDetail } from "@/components/portfolios/community-profile-detail";

type PageProps = { params: Promise<{ userId: string }> };

export default async function CommunityProfilePage({ params }: PageProps) {
  const { userId } = await params;
  return <CommunityProfileDetail userId={userId} />;
}
