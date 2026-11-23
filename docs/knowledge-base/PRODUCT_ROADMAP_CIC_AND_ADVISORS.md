# Roadmap Sản phẩm (v1.13+): Điểm Tín dụng CIC & Kết nối Chuyên gia / Quản gia Tài chính

> **Tài liệu hoạch định chiến lược (tạo tại v1.12.0.0 — 23/11/2026)**
> Tổng hợp kiến trúc đề xuất cho 2 phân hệ lớn tiếp theo trên VnSavingPro: **(1) Công cụ ước tính sức khỏe tín dụng CIC (`/cic`)** và **(2) Mạng lưới kết nối Chuyên gia & Quản gia Tài chính tại Việt Nam (`/advisors`)**, kèm đối chiếu thực tế thị trường Việt Nam.

---

## Phần I. Kế hoạch phát triển Phân hệ 1 — Tính toán & Đánh giá Điểm Tín dụng CIC (`/cic`)

### 1. Mục tiêu sản phẩm & Bối cảnh tại Việt Nam
- Người trẻ tại Việt Nam thường tích luỹ qua sổ tiết kiệm ngân hàng số (`VnSavingPro /plan`) đồng thời chuẩn bị hồ sơ **vay mua nhà, mua xe, hoặc mở hạn mức tín dụng**.
- Trung tâm Thông tin Tín dụng Quốc gia Việt Nam (**CIC — Ngân hàng Nhà nước Việt Nam**, cổng chính thức [`cic.gov.vn`](https://cic.gov.vn) và app **CIC Credit Connect**) cho phép công dân tra cứu báo cáo tín dụng cá nhân **miễn phí 1 lần/năm**, nhưng **không công bố công thức chính thức** và **chưa có công cụ mô phỏng "What-If"** trước khi vay hoặc mở thẻ.
- VnSavingPro sẽ xây dựng **Trình ước tính Sức khỏe Tín dụng CIC (CIC Readiness Simulator)** hoàn toàn trên Vercel Serverless API (`api/calculate.js` — action `cic_score`), **không thu thập hay lưu CCCD/CMND hoặc số tài khoản ngân hàng** để tuân thủ **Nghị định 13/2023/NĐ-CP** về bảo vệ dữ liệu cá nhân.

### 2. Khung mô hình 5 nhóm trọng số & Thang điểm tham chiếu CIC
Theo chuẩn chấm điểm tín dụng phổ biến được CIC áp dụng tại Việt Nam (thang **403–706 điểm**, quy đổi **Hạng 1 đến Hạng 10**):

| Trụ cột đánh giá | Trọng số đề xuất | Chỉ số đầu vào từ người dùng (ẩn danh) |
| :--- | :---: | :--- |
| **1. Lịch sử thanh toán đúng hạn** | **35%** | Trạng thái Nhóm nợ hiện tại (Nhóm 1–5 theo Thông tư NHNN) & số lần trễ hạn trong 12–24 tháng |
| **2. Dư nợ hiện tại & Tỷ lệ DTI / Utilization** | **30%** | Tổng trả nợ vay + thẻ hàng tháng chia Thu nhập ròng (`DTI %`), % hạn mức thẻ tín dụng đang sử dụng |
| **3. Thời gian lịch sử tín dụng** | **15%** | Số năm sở hữu thẻ tín dụng / khoản vay đầu tiên đã ghi nhận |
| **4. Đa dạng danh mục tín dụng** | **10%** | Số loại hình tín dụng cân bằng (Thẻ tín dụng, Vay tiêu dùng, Vay tài sản đảm bảo / sổ tiết kiệm) |
| **5. Tần suất mở mới & Tra cứu (Inquiries)** | **10%** | Số lần đăng ký mở thẻ/vay mới trong 6–12 tháng gần nhất |

### 3. Quy ước Hạng CIC & Phân loại 5 Nhóm nợ NHNN
- **Thang điểm & Xếp hạng (Hạng 1–10)**:
  - **Hạng 1–4 (`~595–706+`)**: Rủi ro thấp — **Tốt / Rất tốt**, dễ duyệt vay thế chấp/tín chấp lãi suất ưu đãi.
  - **Hạng 5–8 (`~500–594`)**: Rủi ro **Trung bình** — cần tối ưu tỷ lệ sử dụng thẻ (<30%) và DTI (<40%) trước khi nộp hồ sơ lớn.
  - **Hạng 9–10 (`403–499`)**: Rủi ro **Cao / Cần phục hồi** — ưu tiên tất toán nợ quá hạn và chờ làm sạch lịch sử CIC (Nhóm 2 cần ~12 tháng; Nhóm 3–5 cần tối thiểu 5 năm sau tất toán).
- **Bảng 5 Nhóm nợ quy đổi trực tiếp trong mô hình**:
  - **Nhóm 1 (Đủ tiêu chuẩn)**: Quá hạn `< 10 ngày` — không bị trừ điểm nghiêm trọng.
  - **Nhóm 2 (Nợ cần chú ý)**: Quá hạn `10–90 ngày` — giảm đáng kể điểm sẵn sàng vay.
  - **Nhóm 3 (Nợ dưới chuẩn)**: Quá hạn `91–180 ngày` — cảnh báo Nợ xấu mức 1.
  - **Nhóm 4 (Nợ nghi ngờ)**: Quá hạn `181–360 ngày` — cảnh báo Nợ xấu mức 2.
  - **Nhóm 5 (Có khả năng mất vốn)**: Quá hạn `> 360 ngày` — cảnh báo Nợ xấu nặng nhất.

### 4. Điểm khác biệt tích hợp với hệ sinh thái VnSavingPro
- **Cộng hưởng Tiết kiệm -> Sổ cầm cố / Chứng minh tài chính**: Đề xuất chiến lược dùng **Sổ tiết kiệm kỳ hạn 12M (`Cake`, `LioBank`, `Timo`, `TNEX`)** từ `/plan` để giảm DTI ròng hoặc cầm cố sổ vay lãi thấp thay vì mở thẻ tín dụng mới.
- **Lộ trình phục hồi CIC What-If**: Kéo thanh trượt xem *"Nếu hạ tỷ lệ quẹt thẻ từ 75% xuống 25% và tất toán 1 khoản trả góp -> điểm sẵn sàng tăng bao nhiêu?"*.
- **Ghi nhận vào Lịch sử Profile**: Lưu kết quả ước tính ẩn danh vào `calculation_history` (`tool = 'cic'`) mà tuyệt đối không gửi PII (CCCD, họ tên, số thẻ).
- **Tuyên bố minh bạch bắt buộc**: Mọi kết quả chỉ là *ước tính mô phỏng phục vụ tự rà soát*; người dùng được hướng dẫn tra cứu báo cáo chính thức miễn phí tại **CIC (`cic.gov.vn` / CIC Credit Connect)**.

---

## Phần II. Nghiên cứu Thị trường Việt Nam — Chuyên gia & Quản gia Tài chính (Wealth Management & Advisors)

### 1. Thực trạng & Các đơn vị tiêu biểu đang hoạt động tại Việt Nam (Nghiên cứu 2025–2026)

Thị trường Việt Nam hiện đang chứng kiến sự chuyển dịch mạnh từ mô hình **môi giới bán chéo sản phẩm đơn lẻ (chứng khoán / bảo hiểm)** sang **Cố vấn tài chính cá nhân & Quản lý gia sản độc lập (Wealth Advisory / Financial Planning)**, được thúc đẩy bởi Cộng đồng **Cố vấn Tài chính Việt Nam (VWA — Vietnam Wealth Advisors)** và diễn đàn thường niên **VWAS (Vietnam Wealth Advisor Summit)**, cùng các chuẩn chứng chỉ hành nghề **CFP / CWP / CFA**:

| Đơn vị / Nền tảng | Mô hình hoạt động chính | Nhóm khách hàng mục tiêu | Điểm chạm & Chênh lệch so với VnSavingPro |
| :--- | :--- | :--- | :--- |
| **FIDT** (CTCP Tư vấn Đầu tư & Quản lý Tài sản) | Hoạch định tài chính cá nhân toàn diện độc lập (Holistic Financial Planning); các gói **Wealth Master**, **Wealth Insight**, **Wealth Legacy**; theo đuổi chuẩn quốc tế (tương đồng CFP). | Trung lưu khá giả (`Affluent`), `HNWI`, gia đình cần phân bổ tài sản đa lớp (tiết kiệm, BĐS, chứng khoán, hưu trí, thừa kế). | Phí tư vấn chuyên sâu cao; mạnh về **Chiến lược tổng thể & Di sản**, không tập trung theo dõi từng sổ tiết kiệm số hàng tháng. |
| **AFA Capital** | Tư vấn quản lý tài sản, cố vấn tăng trưởng tài sản cá nhân & gia đình/doanh nghiệp theo chuẩn minh bạch đạo đức nghề nghiệp (`CFA` / `CFP` principles). | Khách hàng giàu có, chủ doanh nghiệp, nhà đầu tư kỷ luật cần quản trị rủi ro danh mục. | Chú trọng chiến lược đầu tư vĩ mô & phân bổ vốn lớn; ít phục vụ giai đoạn **khởi đầu tích luỹ tiền gửi 5–30 triệu/tháng**. |
| **FinPeace** | Cộng đồng giáo dục & huấn luyện tài chính cá nhân (**Coaching-first**), dịch vụ **Wealth Checkup / Portfolio Checkup** giúp rà soát sức khỏe tài chính và phân bổ danh mục. | Người đi làm trẻ, cặp đôi trẻ mới bắt đầu đầu tư & lập kế hoạch tài chính bài bản. | Có tinh thần gần nhất với tệp người dùng trẻ của VnSavingPro, kết hợp coaching & review danh mục định kỳ. |
| **TOPI** (thuộc VAM) | Ứng dụng Fintech tích luỹ & quản lý tài sản tự động trên di động (gửi tích luỹ từ 50.000₫, chứng chỉ quỹ, vàng, theo dõi mục tiêu). | Đại chúng trẻ (`Mass / Emerging Affluent`) thích tự thao tác 100% trên app. | Thiên về **sản phẩm tích luỹ / giao dịch trên app đối tác**, không đóng vai trò cố vấn trung lập so sánh nhiều ngân hàng số khác nhau. |
| **MoneyGain** | Nền tảng phân tích định lượng cổ phiếu, xếp hạng cơ hội đầu tư (`Rating`) và nghiên cứu thị trường chuyên sâu. | Nhà đầu tư chứng khoán cá nhân cần công cụ lọc & phân tích định lượng. | Tập trung hoàn toàn vào **thị trường cổ phiếu**, không giải quyết bài toán **tiết kiệm an toàn & lãi suất ngân hàng số**. |
| **Private Banking** (Techcombank Private, VPBank Diamond/Private, MB Private...) | Quản gia tài sản & Giám đốc quan hệ khách hàng (`RM`) riêng tại ngân hàng thương mại. | Khách hàng `VIP / HNWI` có NAV lớn (thường từ nhiều tỷ VND tại một ngân hàng). | **Độc quyền hệ sinh thái 1 ngân hàng**; người dùng thu nhập vừa hoặc dùng nhiều ngân hàng số (`Cake`, `TNEX`, `Timo`, `LioBank`) khó tiếp cận hoặc thiếu tính khách quan đa nền tảng. |

### 2. Khoảng trống thị trường ("Whitespace") cho VnSavingPro
1. **Thiếu cầu nối từ Dữ liệu Tích luỹ Chuẩn hoá -> Buổi Review 1-1 giá hợp lý**: Hầu hết người dùng 22–38 tuổi đã có số liệu tiết kiệm, thu nhập & quỹ dự phòng nhưng ngại thuê gói cố vấn `Private Wealth` đắt đỏ, hoặc gửi bản Excel rời rạc khiến chuyên gia mất 60% thời gian buổi đầu chỉ để nhập liệu lại.
2. **Vai trò "Người kết nối trung lập" (Connector Model)**: VnSavingPro **KHÔNG tự hành nghề môi giới hay bán bảo hiểm/quỹ ủy thác** (tránh xung đột lợi ích & rào cản giấy phép tư vấn đầu tư trực tiếp), mà đóng vai trò **Nền tảng chuẩn hoá hồ sơ + Kết nối (Marketplace Connector)** với Chuyên gia độc lập đã xác minh.

---

## Phần III. Kiến trúc Kết nối Chuyên gia & Quản gia Tài chính (`/advisors`)

### 1. Luồng trải nghiệm 4 bước (Connector Flow)
1. **Bước 1 — Chuẩn hoá Snapshot ẩn danh (1-Click Financial Brief)**:
   - Hệ thống trích xuất tóm tắt kế hoạch từ `/plan` + sức khỏe `/cic` (nếu có): *Mô hình hộ gia đình (`Cá nhân` / `Cặp đôi` / `Gia đình`), Thu nhập, Chi phí cố định, Tỷ lệ phủ Quỹ dự phòng, Mục tiêu tài chính & Ngưỡng rủi ro* — **mặc định che tên thật & thông tin ngân hàng định danh**.
2. **Bước 2 — Duyệt danh bạ Chuyên gia / Quản gia Tài chính đã xác minh (`Directory`)**:
   - Lọc theo nhu cầu thực tế: *Review kế hoạch tiết kiệm & mua nhà*, *Hoạch định tài chính Cặp đôi/Gia đình*, *Tối ưu nợ & chuẩn bị vay mua nhà (CIC + DTI)*, hoặc *Chuyển dịch từ Tiết kiệm -> Đầu tư an toàn*.
   - Hiển thị huy hiệu minh bạch: Chứng chỉ (`CFP` / `CFA` / `CWP` / đối tác `FIDT` · `FinPeace` · `AFA` hoặc Chuyên gia độc lập), Chuyên môn, Ngôn ngữ (`VI` / `EN`), Khung phí niêm yết hoặc **Buổi đánh giá nhanh 30 phút (Health Checkup)**.
3. **Bước 3 — Đặt lịch & Cấp quyền đọc tạm thời (Read-Only Shared Snapshot)**:
   - Sinh `advisor_share_token` (hết hạn tự động sau **7 ngày** hoặc thu hồi bất kỳ lúc nào trong Profile), cho phép chuyên gia xem trước bài toán dòng tiền mà **không cần gửi file Excel thủ công** và **không giữ quyền chỉnh sửa dữ liệu gốc**.
4. **Bước 4 — Theo dõi Đánh giá & Kế hoạch hành động (`Action Plan Checklist`)**:
   - Chuyên gia gửi lại *3–5 khuyến nghị cụ thể* ngay trong Profile người dùng (VD: Tách 30% quỹ sang kỳ hạn 6T để khớp mốc dự phòng; giữ DTI dưới 35% trong 6 tháng tới).

### 2. Mô hình Dữ liệu đề xuất (`supabase/migrations/...` trong tương lai)
- `public.advisor_profiles`: danh bạ chuyên gia (`slug`, `full_name`, `organization`, `credentials`, `specialties[]`, `fee_tier`, `verified_status`, `booking_url`).
- `public.advisor_requests`: yêu cầu kết nối của người dùng (`user_id`, `advisor_id`, `household_mode`, `sanitized_snapshot_jsonb`, `goal_note`, `status` [`pending` | `matched` | `reviewed` | `closed`], `share_expires_at`, `advisor_notes`).
- Chính sách RLS nghiêm ngặt + tuân thủ Nghị định 13/2023/NĐ-CP (consent rõ ràng trước khi chia sẻ Snapshot với bất kỳ chuyên gia nào).

### 3. Đề xuất thứ tự triển khai
- **Giai đoạn A (`v1.13.0.0`)**: Phát hành **`/cic` (CIC Readiness Simulator)** hoàn toàn miễn phí, kết hợp liên kết chéo với `/plan` (gợi ý tối ưu DTI & Sổ tiết kiệm dự phòng).
- **Giai đoạn B (`v1.14.0.0`)**: Phát hành **`/advisors` (Directory + Anonymous 1-Click Snapshot Request)** dạng Beta với nhóm đối tác cố vấn độc lập đầu tiên (chuẩn VWA / CFP / FinPeace / FIDT / cố vấn độc lập) tại Việt Nam.
