import { useState } from "react";
import Modal from "../../src/components/ui/Modal";
import Button from "../../src/components/ui/Button";

export default {
  title: "واجهة/نافذة",
  component: Modal,
};

export const افتراضية = () => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button onClick={() => setOpen(true)}>فتح النافذة</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="تأكيد الإجراء"
        footer={<Button onClick={() => setOpen(false)}>إغلاق</Button>}
      >
        هذه نافذة منبثقة تدعم الاتجاه العربي وإدارة التركيز.
      </Modal>
    </div>
  );
};
