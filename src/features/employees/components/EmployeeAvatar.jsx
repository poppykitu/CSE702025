import { useState } from 'react'
import { Avatar } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { getInitials, getAvatarColor } from '@/utils/helpers'

/**
 * Avatar component cho nhân viên
 * Hiển thị ảnh thật, hoặc fallback sang initials với màu tự sinh
 */
export default function EmployeeAvatar({ name = '', avatarUrl = null, size = 40, style = {} }) {
  const [imgError, setImgError] = useState(false)
  const initials = getInitials(name)
  const bgColor = getAvatarColor(name)

  if (avatarUrl && !imgError) {
    return (
      <Avatar
        size={size}
        src={avatarUrl}
        alt={name}
        onError={() => setImgError(true)}
        style={{ flexShrink: 0, ...style }}
      />
    )
  }

  return (
    <Avatar
      size={size}
      icon={!initials ? <UserOutlined /> : undefined}
      style={{
        background: bgColor,
        color: '#fff',
        fontFamily: 'var(--font-sans)',
        fontWeight: 700,
        fontSize: size * 0.35,
        flexShrink: 0,
        letterSpacing: '0.5px',
        ...style,
      }}
    >
      {initials}
    </Avatar>
  )
}
