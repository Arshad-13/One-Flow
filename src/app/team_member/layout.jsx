import RoleBasedLayout from '@/components/RoleBasedLayout'

export default function TeamMemberLayout({ children }) {
    return <RoleBasedLayout role="team_member">{children}</RoleBasedLayout>
}
