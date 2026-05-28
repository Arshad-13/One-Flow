import RoleBasedLayout from '@/components/RoleBasedLayout'

export default function ProjectManagerLayout({ children }) {
    return <RoleBasedLayout role="project_manager">{children}</RoleBasedLayout>
}
