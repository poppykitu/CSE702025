import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'

/**
 * Service quản lý tài liệu nhân viên
 * Hỗ trợ upload và truy xuất Hợp đồng, Bảo hiểm, CCCD
 */

export async function getEmployeeDocuments(employeeId) {
  if (!isSupabaseConfigured) return []

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function uploadEmployeeDocument(employeeId, file, title, category) {
  if (!isSupabaseConfigured) return

  const fileExt = file.name.split('.').pop()
  const fileName = `${employeeId}-${category}-${Date.now()}.${fileExt}`
  const filePath = `documents/${employeeId}/${fileName}`

  // 1. Upload file to Storage
  const { error: uploadError } = await supabase.storage
    .from('employee_documents')
    .upload(filePath, file)

  if (uploadError) throw new Error(uploadError.message)

  // 2. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('employee_documents')
    .getPublicUrl(filePath)

  // 3. Insert record into documents table
  const { data, error } = await supabase
    .from('documents')
    .insert([{
      employee_id: employeeId,
      title: title,
      category: category,
      file_url: publicUrl,
      file_type: fileExt.toUpperCase(),
      uploaded_by: (await supabase.auth.getUser()).data.user.id
    }])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteDocument(id, filePath) {
  if (!isSupabaseConfigured) return

  // 1. Delete from DB
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)

  if (dbError) throw new Error(dbError.message)

  // 2. Delete from Storage (Optional but recommended)
  // Need to pass the correct path
  // await supabase.storage.from('employee_documents').remove([filePath])
}
