# Bật đồng bộ tài khoản cho SONORA

Mã đã sẵn sàng cho Google và email/mật khẩu qua Firebase Authentication, và nhật ký riêng theo tài khoản qua Cloud Firestore. Bản này chưa tự tạo database hay xuất bản rules trong Firebase của bạn. Không cần chuyển hosting khỏi GitHub Pages.

## 1. Sao lưu trước khi cập nhật

Trên SONORA đang có ký ức, bấm Export collection / Xuất bản sao. Nhật ký khách ở các tên miền khác nhau không tự đi theo. Không xóa dữ liệu trình duyệt trước khi đã xuất bản sao.

## 2. Tạo Firestore

1. Vào Firebase Console, chọn đúng dự án `sonora-music-diary`.
2. Tìm **Firestore Database** (có thể nằm trong **Databases & Storage** hoặc **Build**).
3. Chọn **Create database**, **Standard edition**, ID **(default)**.
4. Chọn vị trí lưu dữ liệu phù hợp; Singapore (`asia-southeast1`) nếu có và người dùng chủ yếu tại Việt Nam. Cân nhắc trước khi tạo vì vị trí database không đổi trực tiếp được.
5. Chọn **Production mode**, rồi **Create**. Bước sau sẽ cấp quyền riêng cho mỗi tài khoản.
6. Nếu database `(default)` đã tồn tại thì dùng database đó, không tạo thêm.

## 3. Xuất bản quy tắc

Mở tab **Rules** của Firestore. Với dự án chỉ dùng cho SONORA, thay nội dung bằng toàn bộ file `firestore.rules` đi kèm, rồi bấm **Publish**.

Nếu database còn phục vụ ứng dụng khác, cần ghép quy tắc `/diaries/{uid}` và kiểm tra các quy tắc hiện có trước khi xuất bản. Không giữ quy tắc toàn cục `allow read, write: if true` hoặc quyền đọc cho tất cả người đã đăng nhập: các quyền cho phép ở nhiều match được kết hợp, nên chúng có thể làm mất bảo vệ riêng tư.

Quy tắc kèm theo chỉ cho người có `request.auth.uid` trùng UID trong đường dẫn đọc/ghi. Không có quyền đọc toàn bộ nhật ký người khác. Mỗi bản ghi phải có revision tăng đúng một, payload không quá 700.000 byte, và thời điểm ghi do server xác nhận.

Có thể dùng CLI thay cho giao diện, từ thư mục chứa `firebase.json`:

```sh
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project sonora-music-diary
```

Lệnh này cập nhật rules, không đưa giao diện lên GitHub Pages. Không cần tải Service Account hoặc gửi mật khẩu cho trợ lý.

## 4. Cập nhật GitHub Pages

Giải nén `sonora-cloud-sync.zip`. Vào repo `imnotdaezal/SONORA-MusicDiary` → Add file → Upload files. Tải **toàn bộ file bên trong `dist/`** lên thư mục gốc repo để thay bản cũ. Hai file mới `sync.js` và `sync-core.mjs` cũng phải có tại đó. Commit và đợi Pages hoàn thành.

Giữ cấu hình Pages hiện tại: `main` và `/ (root)`. Trong Firebase Authentication → Settings → Authorized domains, cần có `imnotdaezal.github.io`. Không đổi `authDomain` trong `firebase-config.js`.

## 5. Kiểm tra bằng hai thiết bị

1. Mở SONORA mới, đăng nhập tài khoản A. Chờ **Cloud diary up to date / Nhật ký đã đồng bộ**.
2. Nhật ký tài khoản mới ban đầu trống. Trong Account, bấm **Add this device’s memories to my account / Thêm ký ức trên máy vào tài khoản**, rồi xác nhận. Các bài mẫu không được nhập tự động.
3. Nếu ký ức nằm ở tên miền cũ, nhập file sao lưu bằng Import collection trên tên miền mới sau khi đăng nhập.
4. Thêm một bài, đợi trạng thái **đã đồng bộ**. Trên thiết bị thứ hai, đăng nhập **cùng tài khoản** và kiểm tra bài, lời nhắn, màu, chòm sao, vị trí ngôi sao.
5. Sửa hoặc xóa một bài thử nghiệm và kiểm tra thiết bị kia cập nhật.
6. Đăng xuất: chỉ nhật ký khách của thiết bị được hiển thị. Đăng nhập tài khoản B: không được thấy nhật ký A.
7. Trong Firebase Rules Playground, kiểm tra đọc `/diaries/UID_A`: chưa đăng nhập bị từ chối, UID_B bị từ chối, UID_A được phép. Rules chưa được chạy qua emulator trong môi trường tạo bản mã này.

## Khi mạng lỗi hoặc hai thiết bị cùng sửa

- Nhật ký tài khoản cần mạng để lưu. Khi chờ lưu hoặc có lỗi, thao tác sửa tiếp bị khóa; bạn vẫn có thể nghe và xuất bản sao.
- Lỗi ghi giữ một bản khôi phục trong trình duyệt, gắn UID của tài khoản. Nếu trình duyệt không lưu được bản này, giao diện sẽ báo. Không đóng trang khi chưa đồng bộ hoặc chưa xuất bản sao.
- Bấm **Retry sync** khi kết nối trở lại. Không báo thành công chỉ vì bản sao cục bộ đã lưu.
- Khi một thiết bị sửa trên bản cũ, hệ thống từ chối ghi đè. Bấm **Export my copy & load cloud diary** để tải bản của mình xuống trước rồi lấy bản mới từ mây. Sau đó Import collection nếu cần giữ ký ức cũ; bản sửa cùng ID được giữ thành một ngôi sao riêng để bạn đối chiếu.
- Đăng xuất bị chặn khi có thay đổi chưa đồng bộ. Đồng bộ thành công hoặc xuất bản sao và tải lại bản mây trước.
- File sao lưu tải xuống chứa ký ức cá nhân; giữ ở nơi phù hợp. Bản khôi phục trên trình duyệt không được mã hóa riêng.

## Giới hạn và trạng thái xác minh

- Một nhật ký tài khoản tối đa 700 KB ở bản này; không lưu file nhạc/video, chỉ lưu link, nội dung và cấu hình hiển thị.
- Không đồng bộ bài đang phát/vị trí nghe. Không thêm tìm kiếm Spotify hay YouTube catalogue.
- Không thêm giao diện liên kết hai tài khoản khác UID. Dùng cùng phương thức/tài khoản trên hai máy khi kiểm tra. Nếu đã có hai tài khoản riêng, cần xử lý liên kết hoặc chuyển dữ liệu riêng, không tự gộp bằng email.
- Kiểm thử tự động dùng Firebase giả lập ở mức SDK: chuyển thiết bị, xung đột, lỗi mạng, khôi phục, chuyển tài khoản và ghi trả về muộn. Chưa xác nhận đồng bộ trên Firebase thật của chủ dự án, chưa triển khai rules từ môi trường này.
- Chủ dự án có quyền quản trị Firebase; quy tắc bảo vệ giữa người dùng không phải mã hóa đầu cuối.

Tài liệu Firebase: https://firebase.google.com/docs/firestore/quickstart và https://firebase.google.com/docs/firestore/security/rules-conditions
