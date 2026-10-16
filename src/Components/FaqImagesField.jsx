import React, { useEffect, useMemo } from "react";

export const MAX_FAQ_IMAGES = 10;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE = /\.(png|jpe?g|webp)$/i;

const thumbStyle = {
  position: "relative",
  width: 96,
  height: 96,
  borderRadius: 8,
  overflow: "hidden",
  border: "1px solid rgba(128,128,128,0.35)",
  background: "rgba(128,128,128,0.1)",
};
const removeStyle = {
  position: "absolute",
  top: 4,
  right: 4,
  width: 22,
  height: 22,
  lineHeight: "20px",
  padding: 0,
  borderRadius: "50%",
  border: "none",
  background: "rgba(0,0,0,0.65)",
  color: "#fff",
  cursor: "pointer",
};
const badgeStyle = {
  position: "absolute",
  left: 4,
  bottom: 4,
  padding: "1px 6px",
  borderRadius: 4,
  fontSize: 10,
  background: "rgba(0,0,0,0.65)",
  color: "#fff",
};

/**
 * Multi-image picker for an FAQ (max 10).
 *
 *  - `existing`  images already saved on the FAQ (raw stored values, in order)
 *  - `files`     newly picked File objects, not uploaded yet
 *  - `resolve`   turns a stored value into a loadable URL (legacy filenames)
 *  - `onChange`  ({ existing, files }) — the full new state, never a diff
 *  - `onError`   message for a rejected pick (wrong type, too big, over the cap)
 *
 * The first image is the cover: the app shows it alone when it is the only one
 * and uses it as images[0] on older builds that read a single image.
 */
function FaqImagesField({ existing = [], files = [], resolve = (v) => v, onChange, onError, error }) {
  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files]
  );
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  const total = existing.length + files.length;
  const full = total >= MAX_FAQ_IMAGES;

  const handlePick = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ""; // lets the same file be picked again after removing it
    if (!picked.length) return;

    const problems = [];
    const valid = [];
    picked.forEach((f) => {
      if (!ALLOWED_IMAGE.test(f.name)) problems.push(`${f.name}: use .png, .jpg, .jpeg or .webp`);
      else if (f.size > MAX_IMAGE_BYTES) problems.push(`${f.name}: larger than 5 MB`);
      else valid.push(f);
    });
    const room = MAX_FAQ_IMAGES - total;
    if (valid.length > room) problems.push(`Only ${MAX_FAQ_IMAGES} images are allowed — extra files were skipped`);
    onError?.(problems.join(" · "));
    if (room > 0 && valid.length) onChange({ existing, files: [...files, ...valid.slice(0, room)] });
  };

  const removeExisting = (i) => onChange({ existing: existing.filter((_, idx) => idx !== i), files });
  const removeNew = (i) => onChange({ existing, files: files.filter((_, idx) => idx !== i) });

  return (
    <div className="rp_singleinput_holder mb-3">
      <p className="rp_label mb-2">Images ({total}/{MAX_FAQ_IMAGES})</p>
      <div className="rp_input_holder py-2 px-3 rounded-2">
        <input
          type="file"
          name="images"
          accept="image/png,image/jpeg,image/webp"
          multiple
          disabled={full}
          className="rp_singleInput flex-grow-1"
          onChange={handlePick}
        />
      </div>
      <small className="text-muted d-block mt-1">
        Up to {MAX_FAQ_IMAGES} images, 5 MB each (.png, .jpg, .webp). The first image is the cover. In the app, one image
        shows full width; two or more sit two to a row, and an odd last image spans the full row.
      </small>

      {total > 0 && (
        <div className="d-flex flex-wrap gap-2 my-3">
          {existing.map((value, i) => (
            <div key={`existing-${value}-${i}`} style={thumbStyle}>
              <img src={resolve(value)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {i === 0 && <span style={badgeStyle}>Cover</span>}
              <button type="button" style={removeStyle} aria-label="Remove image" onClick={() => removeExisting(i)}>×</button>
            </div>
          ))}
          {previews.map((p, i) => (
            <div key={`new-${p.file.name}-${i}`} style={thumbStyle}>
              <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {existing.length === 0 && i === 0 && <span style={badgeStyle}>Cover</span>}
              <button type="button" style={removeStyle} aria-label="Remove image" onClick={() => removeNew(i)}>×</button>
            </div>
          ))}
        </div>
      )}
      <span className="text-danger">{error}</span>
    </div>
  );
}

export default FaqImagesField;
