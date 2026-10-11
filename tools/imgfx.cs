// Image pipeline for the Chaudhary Nutrition redesign. Compiled on the fly by
// process-images.ps1 / brand-images.ps1 via Add-Type (C# 5 - Windows PowerShell's compiler),
// so: no expression-bodied members, no string interpolation, no out-var.
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;

public static class Fx
{
    // brand palette (ski.pdf)
    public static readonly double[] Navy     = { 14, 16, 61 };
    public static readonly double[] Claret   = { 153, 13, 53 };
    public static readonly double[] Rose     = { 235, 166, 169 };
    public static readonly double[] Honeydew = { 248, 255, 244 };

    // ------------------------------------------------------------------ io
    public static Bitmap Load(string path)
    {
        using (var fs = new FileStream(path, FileMode.Open, FileAccess.Read))
        using (var src = Image.FromStream(fs))
        {
            var bmp = new Bitmap(src.Width, src.Height, PixelFormat.Format32bppArgb);
            bmp.SetResolution(96, 96);
            using (var g = Graphics.FromImage(bmp))
            {
                g.Clear(Color.White);
                g.DrawImage(src, 0, 0, src.Width, src.Height);
            }
            return bmp;
        }
    }

    public static Bitmap LoadKeepAlpha(string path)
    {
        using (var fs = new FileStream(path, FileMode.Open, FileAccess.Read))
        using (var src = Image.FromStream(fs))
        {
            var bmp = new Bitmap(src.Width, src.Height, PixelFormat.Format32bppArgb);
            bmp.SetResolution(96, 96);
            using (var g = Graphics.FromImage(bmp))
            {
                g.Clear(Color.Transparent);
                g.DrawImage(src, 0, 0, src.Width, src.Height);
            }
            return bmp;
        }
    }

    public static byte[] Bytes(Bitmap b)
    {
        var d = b.LockBits(new Rectangle(0, 0, b.Width, b.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        var buf = new byte[d.Stride * b.Height];
        Marshal.Copy(d.Scan0, buf, 0, buf.Length);
        b.UnlockBits(d);
        return buf;
    }

    public static void Put(Bitmap b, byte[] buf)
    {
        var d = b.LockBits(new Rectangle(0, 0, b.Width, b.Height), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
        Marshal.Copy(buf, 0, d.Scan0, buf.Length);
        b.UnlockBits(d);
    }

    public static void SaveJpeg(Bitmap b, string path, long quality)
    {
        var codec = Array.Find(ImageCodecInfo.GetImageEncoders(), c => c.MimeType == "image/jpeg");
        using (var ep = new EncoderParameters(1))
        {
            ep.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, quality);
            b.Save(path, codec, ep);
        }
    }

    public static void SavePng(Bitmap b, string path) { b.Save(path, ImageFormat.Png); }

    // Render region (sx,sy,sw,sh) of src into an outW x outH bitmap. Parts of the region
    // outside the source are filled with bg - this is how we pad as well as crop.
    public static Bitmap Render(Bitmap src, double sx, double sy, double sw, double sh, int outW, int outH, Color bg)
    {
        var dst = new Bitmap(outW, outH, PixelFormat.Format32bppArgb);
        dst.SetResolution(96, 96);
        double scx = outW / sw, scy = outH / sh;
        double ix0 = Math.Max(0, sx), iy0 = Math.Max(0, sy);
        double ix1 = Math.Min(src.Width, sx + sw), iy1 = Math.Min(src.Height, sy + sh);
        using (var g = Graphics.FromImage(dst))
        {
            g.Clear(bg);
            if (bg.ToArgb() == TileMid().ToArgb())
            {
                // padding for studio shots follows the same top-to-bottom tile sweep
                using (var lg = new LinearGradientBrush(new Rectangle(0, 0, outW, outH + 1),
                    Color.FromArgb((int)TileTop[0], (int)TileTop[1], (int)TileTop[2]),
                    Color.FromArgb((int)TileBottom[0], (int)TileBottom[1], (int)TileBottom[2]), 90f))
                    g.FillRectangle(lg, 0, 0, outW, outH);
            }
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.CompositingQuality = CompositingQuality.HighQuality;
            g.SmoothingMode = SmoothingMode.HighQuality;
            if (ix1 > ix0 && iy1 > iy0)
            {
                float l = (float)((ix0 - sx) * scx), t = (float)((iy0 - sy) * scy);
                float r = (float)((ix1 - sx) * scx), btm = (float)((iy1 - sy) * scy);
                using (var ia = new ImageAttributes())
                {
                    ia.SetWrapMode(WrapMode.TileFlipXY);
                    g.DrawImage(src, new[] { new PointF(l, t), new PointF(r, t), new PointF(l, btm) },
                        new RectangleF((float)ix0, (float)iy0, (float)(ix1 - ix0), (float)(iy1 - iy0)), GraphicsUnit.Pixel, ia);
                }
            }
        }
        return dst;
    }

    // ------------------------------------------------------------------ analysis
    static double Lum(double r, double g, double b) { return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255.0; }

    static double Sat(double[] c)
    {
        double mx = Math.Max(c[0], Math.Max(c[1], c[2])), mn = Math.Min(c[0], Math.Min(c[1], c[2]));
        return mx > 0 ? (mx - mn) / mx : 0;
    }

    // Robust colour of a patch: mean of its brighter half, so a product edge poking
    // into the patch doesn't drag the background estimate down.
    static double[] Patch(byte[] px, int w, int h, int x0, int y0, int pw, int ph)
    {
        var cols = new List<double[]>();
        for (int y = Math.Max(0, y0); y < Math.Min(h, y0 + ph); y += 2)
            for (int x = Math.Max(0, x0); x < Math.Min(w, x0 + pw); x += 2)
            {
                int i = (y * w + x) * 4;
                cols.Add(new double[] { px[i + 2], px[i + 1], px[i], Lum(px[i + 2], px[i + 1], px[i]) });
            }
        if (cols.Count == 0) return new double[] { 255, 255, 255 };
        var top = cols.OrderByDescending(c => c[3]).Take(Math.Max(1, cols.Count / 2)).ToList();
        return new double[] { top.Average(c => c[0]), top.Average(c => c[1]), top.Average(c => c[2]) };
    }

    // 3x3 grid of background samples: [row][col] -> rgb. Centre is the brightest edge-mid.
    static double[][][] BackgroundGrid(byte[] px, int w, int h, out int bgLike)
    {
        int pw = Math.Max(8, w / 16), ph = Math.Max(8, h / 16);
        int[] xs = { 0, w / 2 - pw / 2, w - pw };
        int[] ys = { 0, h / 2 - ph / 2, h - ph };
        var grid = new double[3][][];
        var valid = new List<double[]>();
        var ok = new bool[3, 3];
        for (int r = 0; r < 3; r++)
        {
            grid[r] = new double[3][];
            for (int c = 0; c < 3; c++)
            {
                if (r == 1 && c == 1) continue;
                var p = Patch(px, w, h, xs[c], ys[r], pw, ph);
                grid[r][c] = p;
                ok[r, c] = Lum(p[0], p[1], p[2]) > 0.74 && Sat(p) < 0.13;
                if (ok[r, c]) valid.Add(p);
            }
        }
        bgLike = valid.Count;
        double[] fallback = valid.Count > 0
            ? new double[] { valid.Average(v => v[0]), valid.Average(v => v[1]), valid.Average(v => v[2]) }
            : new double[] { 245, 245, 245 };
        for (int r = 0; r < 3; r++)
            for (int c = 0; c < 3; c++)
                if (!(r == 1 && c == 1) && !ok[r, c]) grid[r][c] = fallback;
        var mids = new[] { grid[0][1], grid[1][0], grid[1][2], grid[2][1] };
        grid[1][1] = new double[] { mids.Max(m => m[0]), mids.Max(m => m[1]), mids.Max(m => m[2]) };
        return grid;
    }

    static double Smooth(double e0, double e1, double x)
    {
        double t = Math.Max(0, Math.Min(1, (x - e0) / (e1 - e0)));
        return t * t * (3 - 2 * t);
    }

    // The studio backdrop every product is relit onto: a soft blush sweep built from the
    // palette (rose over honeydew), lighter at the top like a paper cove. The site's card
    // tiles use the same two colours, so cards and photos read as one surface.
    public static readonly double[] TileTop    = { 247, 237, 235 };   // #F7EDEB
    public static readonly double[] TileBottom = { 241, 226, 223 };   // #F1E2DF

    static double[] TileAt(double v)
    {
        return new double[] {
            TileTop[0] + (TileBottom[0] - TileTop[0]) * v,
            TileTop[1] + (TileBottom[1] - TileTop[1]) * v,
            TileTop[2] + (TileBottom[2] - TileTop[2]) * v };
    }

    // Backdrop estimate by region growing on a coarse cell grid: start from smooth, light
    // cells on the border and spread to neighbours that continue the same smooth surface
    // (so a seamless sweep, a glossy floor or a vignette all count as backdrop). Cells the
    // growth never reaches - the product, its shadow and reflection - get the backdrop
    // interpolated from around them. Returns per-pixel RGB (R,G,B order).
    static float[] BackgroundFieldGrown(byte[] px, int w, int h, out double reached)
    {
        int cs = Math.Max(8, Math.Min(w, h) / 40);
        int gw = (w + cs - 1) / cs, gh = (h + cs - 1) / cs, n = gw * gh;
        var cR = new double[n]; var cG = new double[n]; var cB = new double[n];
        var cL = new double[n]; var cS = new double[n]; var cSat = new double[n];
        for (int gy = 0; gy < gh; gy++)
            for (int gx = 0; gx < gw; gx++)
            {
                double sr = 0, sg = 0, sb = 0, sl = 0, sl2 = 0; int cnt = 0;
                for (int y = gy * cs; y < Math.Min(h, gy * cs + cs); y += 2)
                    for (int x = gx * cs; x < Math.Min(w, gx * cs + cs); x += 2)
                    {
                        int i = (y * w + x) * 4;
                        double r = px[i + 2], g = px[i + 1], b = px[i], l = Lum(r, g, b);
                        sr += r; sg += g; sb += b; sl += l; sl2 += l * l; cnt++;
                    }
                int c = gy * gw + gx;
                cR[c] = sr / cnt; cG[c] = sg / cnt; cB[c] = sb / cnt; cL[c] = sl / cnt;
                cS[c] = Math.Sqrt(Math.Max(0, sl2 / cnt - cL[c] * cL[c]));
                cSat[c] = Sat(new[] { cR[c], cG[c], cB[c] });
            }
        var isBg = new bool[n];
        var q = new Queue<int>();
        for (int c = 0; c < n; c++)
        {
            int gx = c % gw, gy = c / gw;
            bool border = gx == 0 || gy == 0 || gx == gw - 1 || gy == gh - 1;
            if (border && cL[c] > 0.55 && cSat[c] < 0.2 && cS[c] < 0.05) { isBg[c] = true; q.Enqueue(c); }
        }
        int[] dx = { 1, -1, 0, 0 }, dy = { 0, 0, 1, -1 };
        while (q.Count > 0)
        {
            int c = q.Dequeue(), gx = c % gw, gy = c / gw;
            for (int k = 0; k < 4; k++)
            {
                int nx = gx + dx[k], ny = gy + dy[k];
                if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
                int m = ny * gw + nx;
                if (isBg[m] || cS[m] > 0.045 || cSat[m] > 0.2) continue;
                double dc = Math.Abs(cR[m] - cR[c]) + Math.Abs(cG[m] - cG[c]) + Math.Abs(cB[m] - cB[c]);
                if (Math.Abs(cL[m] - cL[c]) < 0.03 && dc < 18) { isBg[m] = true; q.Enqueue(m); }
            }
        }
        int bgCount = isBg.Count(b => b);
        reached = (double)bgCount / n;

        // fill unreached cells: onion-peel from the reached ones, then relax
        var fR = new double[n]; var fG = new double[n]; var fB = new double[n];
        var known = new bool[n];
        for (int c = 0; c < n; c++) if (isBg[c]) { fR[c] = cR[c]; fG[c] = cG[c]; fB[c] = cB[c]; known[c] = true; }
        if (bgCount == 0) for (int c = 0; c < n; c++) { fR[c] = fG[c] = fB[c] = 240; known[c] = true; }
        bool changed = true;
        while (changed)
        {
            changed = false;
            var next = (bool[])known.Clone();
            for (int c = 0; c < n; c++)
            {
                if (known[c]) continue;
                int gx = c % gw, gy = c / gw; double ar = 0, ag = 0, ab = 0; int an = 0;
                for (int k = 0; k < 4; k++)
                {
                    int nx = gx + dx[k], ny = gy + dy[k];
                    if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
                    int m = ny * gw + nx;
                    if (known[m]) { ar += fR[m]; ag += fG[m]; ab += fB[m]; an++; }
                }
                if (an > 0) { fR[c] = ar / an; fG[c] = ag / an; fB[c] = ab / an; next[c] = true; changed = true; }
            }
            known = next;
        }
        for (int it = 0; it < 60; it++)
            for (int c = 0; c < n; c++)
            {
                if (isBg[c]) continue;
                int gx = c % gw, gy = c / gw; double ar = 0, ag = 0, ab = 0; int an = 0;
                for (int k = 0; k < 4; k++)
                {
                    int nx = gx + dx[k], ny = gy + dy[k];
                    if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
                    int m = ny * gw + nx; ar += fR[m]; ag += fG[m]; ab += fB[m]; an++;
                }
                fR[c] = ar / an; fG[c] = ag / an; fB[c] = ab / an;
            }

        // bilinear upsample between cell centres
        var f = new float[w * h * 3];
        for (int y = 0; y < h; y++)
        {
            double fy = (y + 0.5) / cs - 0.5; int y0 = Math.Max(0, Math.Min(gh - 1, (int)Math.Floor(fy))); int y1 = Math.Min(gh - 1, y0 + 1);
            double ty = Math.Max(0, Math.Min(1, fy - y0));
            for (int x = 0; x < w; x++)
            {
                double fx = (x + 0.5) / cs - 0.5; int x0 = Math.Max(0, Math.Min(gw - 1, (int)Math.Floor(fx))); int x1 = Math.Min(gw - 1, x0 + 1);
                double tx = Math.Max(0, Math.Min(1, fx - x0));
                int a = y0 * gw + x0, b = y0 * gw + x1, c = y1 * gw + x0, d = y1 * gw + x1, o = (y * w + x) * 3;
                f[o]     = (float)((fR[a] * (1 - tx) + fR[b] * tx) * (1 - ty) + (fR[c] * (1 - tx) + fR[d] * tx) * ty);
                f[o + 1] = (float)((fG[a] * (1 - tx) + fG[b] * tx) * (1 - ty) + (fG[c] * (1 - tx) + fG[d] * tx) * ty);
                f[o + 2] = (float)((fB[a] * (1 - tx) + fB[b] * tx) * (1 - ty) + (fB[c] * (1 - tx) + fB[d] * tx) * ty);
            }
        }
        return f;
    }

    // Bilinear estimate of the original backdrop colour at every pixel (from the 3x3 grid).
    static float[] BackgroundField(int w, int h, double[][][] grid)
    {
        var f = new float[w * h * 3];
        for (int y = 0; y < h; y++)
        {
            double v = (double)y / Math.Max(1, h - 1) * 2; int r0 = v < 1 ? 0 : 1; double tv = v - r0;
            for (int x = 0; x < w; x++)
            {
                double u = (double)x / Math.Max(1, w - 1) * 2; int c0 = u < 1 ? 0 : 1; double tu = u - c0;
                for (int k = 0; k < 3; k++)
                {
                    double a = grid[r0][c0][k] * (1 - tu) + grid[r0][c0 + 1][k] * tu;
                    double b = grid[r0 + 1][c0][k] * (1 - tu) + grid[r0 + 1][c0 + 1][k] * tu;
                    f[(y * w + x) * 3 + k] = (float)(a * (1 - tv) + b * tv);
                }
            }
        }
        return f;
    }

    // Relight the studio backdrop onto the blush tile. Pixels that match the local
    // backdrop are mapped exactly onto the tile colour; darker product pixels are left
    // alone, and pixels *brighter* than the backdrop (white bottles, caps, labels) are left
    // alone too - that's what keeps white packaging from melting into the background.
    // cropY/cropH: the final framing in source pixels. The tile sweep is laid out in that frame, so
    // padding added around the source later (Render) continues the exact same gradient - no seam.
    static void RelightBackground(byte[] px, int w, int h, float[] bgf, double cropY, double cropH)
    {
        for (int y = 0; y < h; y++)
        {
            var T = TileAt(Math.Max(0, Math.Min(1, (y - cropY) / Math.Max(1, cropH))));
            for (int x = 0; x < w; x++)
            {
                int i = (y * w + x) * 4, j = (y * w + x) * 3;
                double lumP = Lum(px[i + 2], px[i + 1], px[i]);
                double lumB = Math.Max(0.2, Lum(bgf[j], bgf[j + 1], bgf[j + 2]));
                double ratio = lumP / lumB;
                double wgt = Smooth(0.60, 0.97, ratio) * (1 - Smooth(1.03, 1.08, ratio));
                double snap = Smooth(0.95, 0.995, ratio) * (1 - Smooth(1.025, 1.05, ratio));
                // channel order in memory is B,G,R; bgf/T are R,G,B
                for (int k = 0; k < 3; k++)
                {
                    double p = px[i + 2 - k];
                    double relit = p * T[k] / Math.Max(1, bgf[j + k]);
                    double o = p + (relit - p) * wgt;
                    o += (T[k] - o) * snap;
                    px[i + 2 - k] = (byte)Math.Max(0, Math.Min(255, Math.Round(o)));
                }
            }
        }
    }

    // Bounding box of the product: anything clearly darker OR brighter than the local
    // backdrop (so white bottles count), ignoring a thin border.
    static Rectangle InkBox(byte[] px, int w, int h, float[] bgf, double thresh)
    {
        int m = Math.Max(2, Math.Min(w, h) / 100);
        int[] rows = new int[h], cols = new int[w];
        for (int y = m; y < h - m; y += 2)
            for (int x = m; x < w - m; x += 2)
            {
                int i = (y * w + x) * 4, j = (y * w + x) * 3;
                double ratio = Lum(px[i + 2], px[i + 1], px[i]) / Math.Max(0.2, Lum(bgf[j], bgf[j + 1], bgf[j + 2]));
                if (ratio < 1 - thresh || ratio > 1 + thresh * 0.7) { rows[y]++; cols[x]++; }
            }
        int minR = Math.Max(3, w / 400), minC = Math.Max(3, h / 400);
        int top = -1, bot = -1, left = -1, right = -1;
        for (int y = 0; y < h; y++) if (rows[y] >= minR) { if (top < 0) top = y; bot = y; }
        for (int x = 0; x < w; x++) if (cols[x] >= minC) { if (left < 0) left = x; right = x; }
        if (top < 0 || left < 0) return Rectangle.Empty;
        return Rectangle.FromLTRB(left, top, right + 1, bot + 1);
    }

    // ------------------------------------------------------------------ grading
    static double[] GradientMap(double l)
    {
        // navy -> rose -> honeydew
        double[] a, b; double t;
        if (l < 0.55) { a = Navy; b = Rose; t = l / 0.55; }
        else { a = Rose; b = Honeydew; t = (l - 0.55) / 0.45; }
        return new double[] { a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t };
    }

    // Blend a palette gradient-map over the photo: shadows lean navy, mids rose,
    // highlights honeydew. 'amount' 0.08-0.12 is a gentle brand cast; 1.0 is a full tritone.
    public static void Grade(Bitmap bmp, double amount, double fade)
    {
        var px = Bytes(bmp);
        for (int i = 0; i < px.Length; i += 4)
        {
            double r = px[i + 2], g = px[i + 1], b = px[i];
            double l = Lum(r, g, b);
            var m = GradientMap(l);
            r += (m[0] - r) * amount; g += (m[1] - g) * amount; b += (m[2] - b) * amount;
            if (fade > 0)
            {
                // matte: lift the darks toward a soft navy, leave highlights alone
                double k = fade * (1 - l);
                r += (Navy[0] + 46 - r) * k; g += (Navy[1] + 46 - g) * k; b += (Navy[2] + 40 - b) * k;
            }
            px[i + 2] = (byte)Math.Max(0, Math.Min(255, r));
            px[i + 1] = (byte)Math.Max(0, Math.Min(255, g));
            px[i] = (byte)Math.Max(0, Math.Min(255, b));
        }
        Put(bmp, px);
    }

    // Duotone/tritone with custom stops (each stop: position 0..1 + rgb).
    public static void Tritone(Bitmap bmp, double[] pos, double[][] cols, double contrast)
    {
        var px = Bytes(bmp);
        for (int i = 0; i < px.Length; i += 4)
        {
            double l = Lum(px[i + 2], px[i + 1], px[i]);
            l = Math.Max(0, Math.Min(1, (l - 0.5) * contrast + 0.5));
            int k = 0; while (k < pos.Length - 2 && l > pos[k + 1]) k++;
            double t = Math.Max(0, Math.Min(1, (l - pos[k]) / (pos[k + 1] - pos[k])));
            for (int ch = 0; ch < 3; ch++)
                px[i + 2 - ch] = (byte)Math.Round(cols[k][ch] + (cols[k + 1][ch] - cols[k][ch]) * t);
        }
        Put(bmp, px);
    }

    public static void Desaturate(Bitmap bmp, double amount)
    {
        var px = Bytes(bmp);
        for (int i = 0; i < px.Length; i += 4)
        {
            double l = 0.299 * px[i + 2] + 0.587 * px[i + 1] + 0.114 * px[i];
            for (int c = 0; c < 3; c++) px[i + c] = (byte)Math.Round(px[i + c] + (l - px[i + c]) * amount);
        }
        Put(bmp, px);
    }

    public static void Sharpen(Bitmap bmp, double amount)
    {
        int w = bmp.Width, h = bmp.Height;
        var px = Bytes(bmp);
        var src = (byte[])px.Clone();
        for (int y = 1; y < h - 1; y++)
            for (int x = 1; x < w - 1; x++)
            {
                int i = (y * w + x) * 4;
                for (int c = 0; c < 3; c++)
                {
                    int o = i + c;
                    double blur = (4 * src[o]
                        + 2 * (src[o - 4] + src[o + 4] + src[o - w * 4] + src[o + w * 4])
                        + src[o - w * 4 - 4] + src[o - w * 4 + 4] + src[o + w * 4 - 4] + src[o + w * 4 + 4]) / 16.0;
                    double v = src[o] + (src[o] - blur) * amount;
                    px[o] = (byte)Math.Max(0, Math.Min(255, Math.Round(v)));
                }
            }
        Put(bmp, px);
    }

    // Fade the outer band of a studio shot into the tile colour, so a shadow cut by the
    // crop (or padding added around a small source) never shows a hard edge.
    static void FeatherToTile(Bitmap bmp, double band)
    {
        int w = bmp.Width, h = bmp.Height;
        var px = Bytes(bmp);
        double bw = band * Math.Min(w, h);
        for (int y = 0; y < h; y++)
        {
            var T = TileAt((double)y / Math.Max(1, h - 1));
            for (int x = 0; x < w; x++)
            {
                double d = Math.Min(Math.Min(x, w - 1 - x), Math.Min(y, h - 1 - y));
                if (d >= bw) continue;
                double t = 1 - Smooth(0, bw, d);
                int i = (y * w + x) * 4;
                for (int k = 0; k < 3; k++) px[i + 2 - k] = (byte)Math.Round(px[i + 2 - k] + (T[k] - px[i + 2 - k]) * t);
            }
        }
        Put(bmp, px);
    }

    static Color TileMid() { var t = TileAt(0.5); return Color.FromArgb((int)t[0], (int)t[1], (int)t[2]); }

    // ------------------------------------------------------------------ product photos
    // Returns "1" for a studio shot (backdrop relit onto the blush tile, reframed) or
    // "0" for a lifestyle shot (graded, shown as-is).
    public static string ProcessProduct(string srcPath, string outLarge, string outSmall, bool isPrimary)
    {
        using (var src = Load(srcPath))
        {
            int w = src.Width, h = src.Height;
            var px = Bytes(src);
            int bgLike;
            var grid = BackgroundGrid(px, w, h, out bgLike);
            double reached;
            var bgf = BackgroundFieldGrown(px, w, h, out reached);
            // studio = light neutral border all round AND a backdrop that actually connects
            bool studio = bgLike >= 6 && reached > 0.30;

            double sx, sy, sw, sh;
            Color fill = Color.White;
            if (studio)
            {
                var box = InkBox(px, w, h, bgf, 0.075);
                fill = TileMid();
                if (box.IsEmpty || box.Width < w * 0.05 || box.Height < h * 0.05)
                {
                    sw = Math.Max(w, h); sx = (w - sw) / 2; sy = (h - sw) / 2;
                }
                else
                {
                    // squat jars and square groups read heavier than slim bottles, so give
                    // them more air: fill 64% of the frame when square, up to 78% when slim
                    double big = Math.Max(box.Width, box.Height), small = Math.Max(1, Math.Min(box.Width, box.Height));
                    double fillRatio = 0.64 + 0.14 * Math.Max(0, Math.Min(1, (big / small - 1) / 1.5));
                    double side = big / fillRatio;
                    side = Math.Max(side, Math.Min(w, h) * 0.5);    // never zoom past ~2x
                    side = Math.Min(side, Math.Max(w, h) * 1.15);
                    double cx = box.Left + box.Width / 2.0, cy = box.Top + box.Height / 2.0;
                    sw = side; sx = cx - side / 2; sy = cy - side / 2 - side * 0.02;
                }
                sh = sw;
                RelightBackground(px, w, h, bgf, sy, sh);
                Put(src, px);
            }
            else if (isPrimary)
            {
                // lifestyle card image: centred square crop
                sw = Math.Min(w, h); sh = sw; sx = (w - sw) / 2; sy = (h - sh) / 2;
            }
            else
            {
                // lifestyle gallery image (often an infographic): pad, never crop text
                sw = Math.Max(w, h); sh = sw; sx = (w - sw) / 2; sy = (h - sh) / 2;
                var edge = new[] { grid[0][0], grid[0][2], grid[2][0], grid[2][2] };
                fill = Color.FromArgb((int)edge.Average(e => e[0]), (int)edge.Average(e => e[1]), (int)edge.Average(e => e[2]));
            }

            var targets = new List<Tuple<string, int>>();
            targets.Add(Tuple.Create(outLarge, 1000));
            if (!string.IsNullOrEmpty(outSmall)) targets.Add(Tuple.Create(outSmall, 600));
            foreach (var t in targets)
            {
                using (var o = Render(src, sx, sy, sw, sh, t.Item2, t.Item2, fill))
                {
                    if (studio) FeatherToTile(o, 0.035);
                    else Grade(o, 0.10, 0);
                    Sharpen(o, t.Item2 >= 1000 ? 0.35 : 0.45);
                    SaveJpeg(o, t.Item1, t.Item2 >= 1000 ? 84L : 82L);
                }
            }
            return studio ? "1" : "0";
        }
    }

    // ------------------------------------------------------------------ logo
    // Recolour the original multi-colour mark into the palette, keyed by hue:
    // purple -> body, orange/yellow N -> letter, light-green crescent -> arc, dark-green leaves -> leaf.
    // cropW/cropH: keep only the top-left cropW x cropH pixels (the mark sits left of the wordmark).
    public static void RecolorLogo(string srcPath, string outPath, int cropW, int cropH,
                                   double[] body, double[] letter, double[] arc, double[] leaf, int outH)
    {
        using (var src = LoadKeepAlpha(srcPath))
        {
            int w = src.Width, h = Math.Min(src.Height, cropH), cw = Math.Min(w, cropW);
            var px = Bytes(src);
            int minX = w, minY = h, maxX = 0, maxY = 0;
            for (int y = 0; y < src.Height; y++)
                for (int x = 0; x < w; x++)
                {
                    int i = (y * w + x) * 4;
                    if (y >= h || x >= cw) { px[i + 3] = 0; continue; }
                    double r = px[i + 2], g = px[i + 1], b = px[i], a = px[i + 3];
                    double mx = Math.Max(r, Math.Max(g, b)), mn = Math.Min(r, Math.Min(g, b));
                    double sat = mx > 0 ? (mx - mn) / mx : 0, lum = Lum(r, g, b);
                    // white matte (if any) -> transparent
                    if (sat < 0.18) a = a * (1 - Smooth(0.80, 0.96, lum));
                    if (a < 8) { px[i + 3] = 0; continue; }
                    double hue = Hue(r, g, b);
                    double[] c;
                    if (sat < 0.25 && lum < 0.35) c = body;                 // dark outline
                    else if (hue >= 200 && hue <= 300) c = body;            // purple
                    else if (hue >= 10 && hue < 62) c = letter;             // orange -> yellow
                    else if (hue >= 62 && hue < 110) c = arc;               // lime green
                    else if (hue >= 110 && hue < 200) c = leaf;             // dark green
                    else c = letter;
                    px[i + 2] = (byte)c[0]; px[i + 1] = (byte)c[1]; px[i] = (byte)c[2]; px[i + 3] = (byte)a;
                    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
                }
            Put(src, px);
            int bw = maxX - minX + 1, bh = maxY - minY + 1;
            int outW = (int)Math.Round(outH * (double)bw / bh);
            var dst = new Bitmap(outW, outH, PixelFormat.Format32bppArgb);
            using (var g = Graphics.FromImage(dst))
            {
                g.Clear(Color.Transparent);
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                g.CompositingQuality = CompositingQuality.HighQuality;
                g.DrawImage(src, new Rectangle(0, 0, outW, outH), minX, minY, bw, bh, GraphicsUnit.Pixel);
            }
            SavePng(dst, outPath);
            dst.Dispose();
        }
    }

    static double Hue(double r, double g, double b)
    {
        double mx = Math.Max(r, Math.Max(g, b)), mn = Math.Min(r, Math.Min(g, b)), d = mx - mn;
        if (d < 1e-6) return 0;
        double hh;
        if (mx == r) hh = ((g - b) / d) % 6;
        else if (mx == g) hh = (b - r) / d + 2;
        else hh = (r - g) / d + 4;
        hh *= 60; if (hh < 0) hh += 360;
        return hh;
    }

    // ------------------------------------------------------------------ portraits
    public static void Portrait(string srcPath, string outPath, double sx, double sy, double sw, double sh,
                                int outW, int outH, double grade, double fade, string mode)
    {
        using (var src = Load(srcPath))
        using (var o = Render(src, sx, sy, sw, sh, outW, outH, Color.White))
        {
            if (mode == "tritone")
                Tritone(o, new double[] { 0, 0.42, 0.78, 1 }, new[] { Navy, Claret, Rose, Honeydew }, 1.08);
            else
            {
                if (mode == "soft") Desaturate(o, 0.32);   // calm loud clothing/neon before the brand grade
                Grade(o, grade, fade);
            }
            Sharpen(o, 0.3);
            SaveJpeg(o, outPath, 86L);
        }
    }
}
