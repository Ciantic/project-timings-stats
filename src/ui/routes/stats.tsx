import StatsTable from "../components/StatsTable.tsx";

async function testServer() {
  "use server";
  console.log("This is a server function");
}

export default function StatsPage() {
  return <StatsTable />;
}
