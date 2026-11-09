'use client';

import AdminShell from '../../../../components/admin/AdminShell';
import BillingEditor from '../../../../components/admin/BillingEditor';
import { useRouter } from 'next/navigation';

export default function NewBillPage() {
  const router = useRouter();
  return (
    <AdminShell>
      <BillingEditor onSaved={(id) => router.replace(`/admin/billing/${id}`)} />
    </AdminShell>
  );
}
