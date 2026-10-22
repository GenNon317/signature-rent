# Victoria Form 1 Rental Agreement - Online Dual-Signing Platform

Nền tảng trực tuyến cho phép xem xét (review) nội dung và ký hợp đồng thuê nhà theo mẫu chuẩn **Form 1 - Victoria Residential Tenancies Act 1997**.

Hợp đồng: **5 Mannix St, Warrnambool VIC 3280**  
- **Rental Provider 1**: Duc Teo Ngo (`hoanghonlen211@gmail.com`)  
- **Renter 1**: SAMSUL I TALKUDER (`0476620057`)  

---

## 🌟 Tính Năng Nổi Bật

1. **Review Toàn Bộ Hợp Đồng (10 Trang)**:
   - Hiển thị văn bản chất lượng cao, sắc nét.
   - Hỗ trợ công cụ phóng to/thu nhỏ (Zoom 50% - 200%), vừa màn hình, mục lục thumbnails trực quan.
   - Nút nhảy nhanh đến các trang quan trọng: Trang 1 (Thông tin các bên & địa chỉ), Trang 6-7 (Quyền & nghĩa vụ), Trang 9 (Trang Ký Tên).

2. **Chế Độ Ký Cho Cả 2 Bên (Rental Provider 1 & Renter 1)**:
   - 3 phương thức ký linh hoạt:
     - ✍️ **Vẽ tay (Draw)**: Bảng vẽ Canvas cảm ứng mượt mà, hỗ trợ đổi màu mực, độ dày nét vẽ, hoàn tác (Undo), xóa làm lại.
     - ⌨️ **Gõ tên thư pháp (Type)**: Tạo chữ ký thư pháp nghệ thuật theo 4 font calligraphy tinh tế (*Dancing Script, Great Vibes, Caveat, Sacramento*).
     - 📁 **Tải ảnh lên (Upload)**: Tự động tách bỏ nền trắng và tối ưu nét mực chữ ký.
   - Xem trước chữ ký hiển thị trực tiếp theo thời gian thực tại đúng vị trí ô trên Trang 9.

3. **Bảo Đảm Chữ Ký Nằm Gọn Trong Ô - Tuyệt Đối Không Tràn Viền**:
   - Tọa độ vector chính xác theo chuẩn PDF:
     - **Rental Provider 1**: `Rect(160.0, 106.0, 386.0, 149.0)`
     - **Renter 1**: `Rect(160.0, 276.5, 386.0, 300.0)`
   - Tự động cắt bỏ viền trắng trống (*auto-trim*) và áp dụng tỉ lệ `keep_proportion=True` trong PyMuPDF với đệm an toàn, đảm bảo chữ ký nằm trọn vẹn bên trong ô, không bị méo và không bao giờ chạm/tràn ra ngoài đường viền.

4. **Quy Tắc Khóa Tải Về Nghiêm Ngặt (Cả 2 Bên Đồng Thời)**:
   - Khi chưa ký hoặc mới có 1 bên ký: **Tải về bị khóa hoàn toàn**.
   - Chỉ khi **cả 2 bên (Rental Provider 1 và Renter 1) đều đã ký**: Hệ thống mở khóa tải về, hiển thị hiệu ứng chúc mừng (*Confetti*), mở ô nhập Email bắt buộc và kích hoạt nút tải file PDF hoàn chỉnh.

---

## 🚀 Cài Đặt & Chạy Ứng Dụng

### Yêu Cầu
- Python 3.10+
- Pip

### 1. Clone Kho Lưu Trữ
```bash
git clone https://github.com/GenNon317/signature-rent.git
cd signature-rent
```

### 2. Cài Đặt Thư Viện Phụ Thuộc
```bash
pip install -r requirements.txt
```

### 3. Khởi Động Server
```bash
python -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload
```
Hoặc:
```bash
python server.py
```

### 4. Truy Cập Ứng Dụng
Mở trình duyệt web và truy cập:
👉 **http://127.0.0.1:8000/**

---

## 📁 Cấu Trúc Thư Mục

```text
├── Form_1_Rental_Agreement_5_Mannix_St_SAMSUL_I_TALKUDER.pdf   # File hợp đồng gốc Form 1
├── server.py                                                   # Backend FastAPI & xử lý PDF với PyMuPDF
├── requirements.txt                                            # Danh sách thư viện Python
├── .gitignore                                                  # Cấu hình bỏ qua file tạm
├── README.md                                                   # Tài liệu hướng dẫn
└── static/
    ├── index.html                                              # Giao diện chính của ứng dụng
    ├── style.css                                               # Thiết kế giao diện hiện đại
    ├── app.js                                                  # Logic tương tác, bảng vẽ & xác thực
    ├── vendor/
    │   └── confetti.js                                         # Hiệu ứng pháo hoa khi ký thành công
    └── pages/                                                  # Ảnh render 10 trang của hợp đồng
```
