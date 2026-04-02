import React, { useState } from 'react';
import { Modal, Form, Input, Select, message, Alert } from 'antd';
import { MailOutlined, UserOutlined } from '@ant-design/icons';
import { supabase } from '@/lib/supabaseClient';

export default function AddHrModal({ open, onCancel, onSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFinish = async (values) => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Lấy JWT token của user hiện tại để xác thực với Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      
      // Gọi Edge function invite-hr, truyền token rõ ràng vào header
      const { data, error } = await supabase.functions.invoke('invite-hr', {
        body: values, // { email, full_name }
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message || 'Lỗi kết nối Edge Function');
      }

      if (data && data.error) {
        throw new Error(data.error);
      }

      if (data?.email_sent === false) {
        // Tài khoản tạo được nhưng email thất bại
        message.warning(`Tài khoản HR đã được tạo nhưng email gửi thất bại. Chi tiết: ${data.message}`);
      } else {
        message.success('✅ Đã tạo tài khoản HR và gửi email thông tin đăng nhập thành công!');
      }
      form.resetFields();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Thêm Quản Trị Viên (HR)"
      open={open}
      onCancel={() => {
        form.resetFields();
        setErrorMsg('');
        onCancel();
      }}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Gửi lời mời & Tạo Tài Khoản"
      cancelText="Hủy"
      width={500}
    >
      <div style={{ marginBottom: 20, color: 'var(--color-text-secondary)', fontSize: 14 }}>
        Hệ thống sẽ tạo một tài khoản mới với quyền Quan Trị Nhân Sự (HR). Mật khẩu đăng nhập sẽ được tạo ngẫu nhiên và <strong>gửi trực tiếp tới địa chỉ Email</strong> mà bạn nhập dưới đây.
      </div>

      {errorMsg && (
        <Alert
          message={errorMsg}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form layout="vertical" form={form} onFinish={handleFinish}>
        <Form.Item
          name="email"
          label="Địa chỉ Email"
          rules={[
            { required: true, message: 'Vui lòng nhập Email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        >
          <Input 
            prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} 
            type="email" 
            placeholder="vd: hr.nghia@company.com" 
          />
        </Form.Item>

        <Form.Item
          name="full_name"
          label="Họ và tên"
          rules={[
            { required: true, message: 'Vui lòng nhập Họ tên' },
          ]}
        >
          <Input 
            prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} 
            placeholder="Họ tên của HR" 
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
