import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Gift, Pencil, QrCode, Save } from 'lucide-react';
import { useRates, useToast } from '../state.jsx';
import { cryptoStorage } from '../utils/cryptoStorage.js';
import { pct } from '../utils/format.js';
import { Badge, BankMark, Button, Card, Modal, PageHeader } from '../components/ui.jsx';

export default function Referral() {
  const { banks, getRate } = useRates();
  const notify = useToast();

  const [customCodes, setCustomCodes] = useState(() => cryptoStorage.load('CUSTOM_REFERRAL_CODES', {}));
  const [copiedId, setCopiedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [qrBank, setQrBank] = useState(null);

  const getCode = (bank) => customCodes[bank.id] || bank.referralCode;

  const copyCode = (bank) => {
    const code = getCode(bank);
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(bank.id);
      notify(`Đã sao chép mã ${code}`);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const saveCode = (bankId) => {
    const trimmed = editVal.trim();
    const next = { ...customCodes };
    if (trimmed) {
      next[bankId] = trimmed;
    } else {
      delete next[bankId];
    }
    setCustomCodes(next);
    cryptoStorage.save('CUSTOM_REFERRAL_CODES', next);
    setEditingId(null);
    notify('Đã lưu mã giới thiệu cá nhân');
  };

  return (
    <>
      <PageHeader
        icon={Gift}
        eyebrow="Ưu đãi mở tài khoản"
        title="Mở tài khoản ngân hàng số & nhận thưởng"
        description="Sử dụng mã giới thiệu khi đăng ký eKYC để nhận thưởng tiền mặt hoặc cộng thêm lãi suất. Bạn cũng có thể lưu mã giới thiệu của riêng mình để chia sẻ cho bạn bè."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {banks.map((bank) => {
          const code = getCode(bank);
          const isEditing = editingId === bank.id;
          const isCopied = copiedId === bank.id;
          const topRate = Math.max(...Object.values(bank.rates));

          return (
            <Card key={bank.id} className="flex flex-col justify-between gap-5 p-5 sm:p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <BankMark bank={bank} size="lg" />
                    <div>
                      <h3 className="text-base font-semibold text-white">{bank.name}</h3>
                      <p className="text-xs text-zinc-500">{bank.fullName}</p>
                    </div>
                  </div>
                  <Badge tone="success">Lãi đến {pct(topRate)}/năm</Badge>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/[0.06] p-3.5 text-xs leading-relaxed text-emerald-200 ring-1 ring-inset ring-emerald-400/15">
                  <Gift className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  <span>{bank.referralBonus}</span>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Mã giới thiệu</span>
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(bank.id);
                          setEditVal(code);
                        }}
                        className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200"
                      >
                        <Pencil className="size-3" /> Đổi thành mã của tôi
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        placeholder="Nhập mã giới thiệu của bạn..."
                        autoFocus
                        className="h-10 flex-1 rounded-xl bg-black/30 px-3 font-mono text-sm text-white ring-1 ring-inset ring-white/10 outline-none focus:ring-indigo-400/60"
                      />
                      <Button variant="primary" onClick={() => saveCode(bank.id)}>
                        <Save className="size-4" /> Lưu
                      </Button>
                      <Button variant="secondary" onClick={() => setEditingId(null)}>
                        Huỷ
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="flex h-10 flex-1 items-center justify-center rounded-xl bg-black/30 px-4 font-mono text-sm font-semibold tracking-wider text-white ring-1 ring-inset ring-white/10">
                        {code}
                      </div>
                      <Button variant={isCopied ? 'primary' : 'secondary'} onClick={() => copyCode(bank)}>
                        {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                        {isCopied ? 'Đã chép' : 'Sao chép'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 border-t border-white/[0.06] pt-4">
                <Button
                  as="a"
                  href={bank.referralUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  className="flex-1"
                >
                  Mở tài khoản <ExternalLink className="size-4" />
                </Button>
                <Button variant="secondary" onClick={() => setQrBank(bank)} aria-label="Mã QR">
                  <QrCode className="size-4" /> Mã QR
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={Boolean(qrBank)} onClose={() => setQrBank(null)} title={qrBank ? `Mở tài khoản ${qrBank.name}` : ''}>
        {qrBank && (
          <div className="space-y-4 text-center">
            <p className="text-xs text-zinc-400">{qrBank.referralBonus}</p>
            <div className="mx-auto inline-flex rounded-2xl bg-white p-3">
              <img src={qrBank.qrImage} alt={`QR ${qrBank.name}`} className="size-44 rounded-lg" />
            </div>
            <div className="text-xs text-zinc-400">
              Mã giới thiệu:{' '}
              <span className="font-mono font-semibold text-white">{getCode(qrBank)}</span>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
