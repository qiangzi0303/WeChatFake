package com.fakeworld.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

/**
 * 锁定 WebView 字号缩放。
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
 */
public class MainActivity extends BridgeActivity {

	/** WebView 默认字号百分比，100 表示不跟随系统缩放。 */
	private static final int FIXED_TEXT_ZOOM = 100;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		lockTextZoom();
	}

	@Override
	public void onResume() {
		super.onResume();
		// 系统字体档位在后台被改动时 WebView 可能已重建设置，回前台再兜一次。
		lockTextZoom();
	}

	private void lockTextZoom() {
		if (this.bridge == null) {
			return;
		}
		WebView webView = this.bridge.getWebView();
		if (webView == null) {
			return;
		}
		WebSettings settings = webView.getSettings();
		if (settings != null) {
			settings.setTextZoom(FIXED_TEXT_ZOOM);
		}
	}
}
