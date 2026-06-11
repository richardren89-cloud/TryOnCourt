export function PhotoUploader() {
  return (
    <section className="upload-panel">
      <h2>上传照片</h2>
      <p>请准备一张正面全身照和一张清晰正面头像。支持 JPG、PNG、WebP。</p>
      <label>
        正面全身照
        <input accept="image/jpeg,image/png,image/webp" name="fullBody" type="file" />
      </label>
      <label>
        正面头像
        <input accept="image/jpeg,image/png,image/webp" name="headshot" type="file" />
      </label>
    </section>
  );
}
