import RoleBasedLayout from '@/components/RoleBasedLayout'

export default function SalesFinanceLayout({ children }) {
    return <RoleBasedLayout role="sales_finance">{children}</RoleBasedLayout>
}
