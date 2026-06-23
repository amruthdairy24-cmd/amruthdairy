import { ReportsClient } from './ReportsClient'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  // No DB table for reports right now, just passing empty data
  return <ReportsClient data={[]} />
}
