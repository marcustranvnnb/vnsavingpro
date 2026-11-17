import React, { useRef } from 'react';
import { Download, Upload, Trash2, ShieldCheck } from 'lucide-react';
import { Button, Callout, Modal } from './ui.jsx';
import { cryptoStorage } from '../utils/cryptoStorage.js';
import { useRates, useToast } from '../state.jsx';

const today = () => new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');

export function DataModal({ open, onClose }) {
  const { customRates, replaceAll } = useRates();
  const notify = useToast();
  const fileRef = useRef(null);
  const referralCount = Object.keys(cryptoStorage.load('CUSTOM_REFERRAL_CODES', {})).length;
  const hasSavedPlan = Boolean(cryptoStorage.load('PLANNER_STATE', null));

  const exportBackup = () => {
    const data = {
      app: 'VnSavingPro',
      version: '1.2',
      exportedAt: new Date().toISOString(),
      customRates: cryptoStorage.load('CUSTOM_RATES', {}),
      customReferralCodes: cryptoStorage.load('CUSTOM_REFERRAL_CODES', {}),
      plannerState: cryptoStorage.load('PLANNER_STATE', null),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `VnSavingPro_Backup_${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Đã tải file sao lưu');
  };

  const importBackup = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (typeof data !== 'object' || data === null) throw new Error('invalid');
      replaceAll(data.customRates && typeof data.customRates === 'object' ? data.customRates : {});
      cryptoStorage.save('CUSTOM_REFERRAL_CODES', data.customReferralCodes || {});
      if (data.plannerState && typeof data.plannerState === 'object') {
        cryptoStorage.save('PLANNER_STATE', data.plannerState);
      }
      notify('Đã khôi phục dữ liệu');
      onClose();
    } catch {
      alert('File sao lưu không hợp lệ.');
    }
  };

  const clearAll = () => {
    if (!confirm('Xoá toàn bộ dữ liệu đã lưu trên thiết bị này? Hành động này không thể hoàn tác.')) return;
    cryptoStorage.clearAll();
    replaceAll({});
    notify('Đã xoá dữ liệu trên thiết bị');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Dữ liệu của bạn">
      <Callout icon={ShieldCheck} tone="brand" className="mb-4">
        Mọi thứ bạn nhập chỉ được lưu trong trình duyệt trên thiết bị này. VnSavingPro không có máy chủ lưu dữ liệu
        người dùng.
      </Callout>
      <dl className="mb-5 divide-y divide-white/[0.05] rounded-xl ring-1 ring-inset ring-white/[0.06]">
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <dt className="text-zinc-400">Lãi suất tự chỉnh</dt>
          <dd className="font-medium tabular-nums text-white">{Object.keys(customRates).length}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <dt className="text-zinc-400">Mã giới thiệu của bạn</dt>
          <dd className="font-medium tabular-nums text-white">{referralCount}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <dt className="text-zinc-400">Kế hoạch thu nhập thụ động</dt>
          <dd className="font-medium text-emerald-300">{hasSavedPlan ? 'Đã lưu tự động' : 'Chưa lưu'}</dd>
        </div>
      </dl>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={exportBackup}>
          <Download className="size-4" /> Sao lưu
        </Button>
        <Button onClick={() => fileRef.current?.click()}>
          <Upload className="size-4" /> Khôi phục
        </Button>
        <Button variant="danger" className="col-span-2" onClick={clearAll}>
          <Trash2 className="size-4" /> Xoá toàn bộ dữ liệu
        </Button>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importBackup} />
    </Modal>
  );
}
