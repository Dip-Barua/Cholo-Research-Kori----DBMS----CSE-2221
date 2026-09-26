import DetailPage from "@/components/pages/DetailPage"

export default function Page({ params }) {
  return <DetailPage section="labs" id={params.id} />
}
