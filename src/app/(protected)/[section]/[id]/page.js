import DetailPage from "@/components/pages/DetailPage"

export default function Page({ params }) {
  return <DetailPage section={params.section} id={params.id} />
}
