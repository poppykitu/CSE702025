import { Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

export default function SearchBar({ value, onChange, placeholder = 'Tìm theo tên, email, mã NV...' }) {
  return (
    <Input
      prefix={<SearchOutlined style={{ color: 'var(--color-text-muted)', fontSize: 14 }} />}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      allowClear
      style={{
        height: 36,
        fontSize: 13,
        fontFamily: 'var(--font-sans)',
      }}
    />
  )
}
