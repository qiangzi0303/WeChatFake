package com.fakeworld.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

/**
 * 锁定 WebView 字号缩放，并关闭文本自动调整。
 *
 * <p>WebView 的 textZoom 默认跟随系统「字体大小」档位，这会让 CSS 里写的 px
 * 在真机上被再乘一个系数。原生 app 用 sp（跟随系统缩放），我们的页面用
 * CSS px（在 width=device-width 下等于 dp，本不跟随缩放），两套机制叠加后
 * 同一个「17.5」在非标准字体档位的手机上渲染结果和原生对不上，且改动 CSS
 * 数值时相对关系不变、观感几乎无变化。
 *
 * <p>这里把 textZoom 固定为 100，使 CSS px 成为确定值。代价是系统字体大小
 * 设置对本应用失效——对高仿微信是预期行为（真微信也有自己的字体设置），
 * 但确实牺牲了无障碍适配，若将来要做应用内字号调节，应在此基础上由页面
 * 自己换算，而不是放开 textZoom。
 *
 * <p><b>文本自动调整（Text Autosizing）</b>：仅锁 textZoom 并不够。Android
 * WebView 的默认布局算法是 {@code TEXT_AUTOSIZING}，它会按容器宽度自行重算
 * 正文字号，把 CSS font-size 当参考值而非最终值。实测症状为：改 CSS 基准
 * 字号后 {@code getComputedStyle} 读到的是新值，但屏幕上正文渲染大小几乎
 * 不变；同一份代码在 PC 浏览器上调整立即生效、装到 Android 上则完全无效；
 * 且该算法主要作用于成段正文，短文本（如列表昵称）不受影响，于是出现
 * 「昵称变大了、正文没变」的割裂现象。故改用 {@code NORMAL} 布局算法，
 * 让 CSS px 成为唯一字号来源。勿改回 TEXT_AUTOSIZING。
 */
public class MainActivity extends BridgeActivity {

	/** WebView 默认字号百分比，100 表示不跟随系统缩放。 */
	private static final int FIXED_TEXT_ZOOM = 100;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		applyFontSettings();
	}

	@Override
	public void onResume() {
		super.onResume();
		// 系统字体档位在后台被改动时 WebView 可能已重建设置，回前台再兜一次。
		applyFontSettings();
	}

	private void applyFontSettings() {
		if (this.bridge == null) {
			return;
		}
		WebView webView = this.bridge.getWebView();
		if (webView == null) {
			return;
		}
		WebSettings settings = webView.getSettings();
		if (settings == null) {
			return;
		}
		settings.setTextZoom(FIXED_TEXT_ZOOM);
		// 关闭按容器宽度重算字号的自动调整，使 CSS px 直接生效。
		settings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.NORMAL);
	}
}
