import * as React from "react"
import { PackageListItem, type PackageStatus, type PaymentStatus } from "./PackageListItem"

export interface PackageSearchResultProps extends React.HTMLAttributes<HTMLDivElement> {
  customerName: string
  phoneNumber: string
  pickupCode: string
  status: PackageStatus
  paymentStatus: PaymentStatus
  amount: number
  dateReceived: string
}

export function PackageSearchResult(props: PackageSearchResultProps) {
  return <PackageListItem {...props} />
}
