(function() {
    "use strict";

    /*
    License: Boost Software License 1.0
    See http://www.boost.org/LICENSE_1_0.txt
    Copyright © 2018 yumetodo <yume-wikijp@live.jp>
    */

    const ore_list = Object.freeze([
        "Iron Ore", "Gold Ore", "Coal Ore",
        "Lapis Lazuli Ore", "Redstone Ore", "Emerald Ore"
    ]);
    const default_pure_extra_dia_factor = 1.98;
    const default_extra_dia_factor_by_other_ores = Object.freeze({
        "Iron Ore": 0.08,
        "Gold Ore": 0.01,
        "Coal Ore": 0.09,
        "Lapis Lazuli Ore": 0.01,
        "Redstone Ore": 0.09,
        "Emerald Ore": 0
    });
    const fortune_factors = Object.freeze([1, 1.25, 1.75, 2.20]);
    const fortune_factors_text = Object.freeze(["なし", "幸運Ⅰ", "幸運Ⅱ", "幸運Ⅲ"]);
    const calc_mode_list = Object.freeze(["n週目まで", "n週目のみ"]);
    const translate_ja = Object.freeze({
        "Iron Ore": "鉄鉱石",
        "Gold Ore": "金鉱石",
        "Coal Ore": "石炭鉱石",
        "Lapis Lazuli Ore": "ラピスラズリ鉱石",
        "Redstone Ore": "レッドストーン鉱石",
        "Emerald Ore": "エメラルド鉱石"
    });

    /**
     * n週目までに採掘されたチャンク数を求める
     * @param {number} n n
     * @return {number}
     */
    const calc_mined_chunk_num_until_n = n => Math.pow((2 * n + 2) / 4, 2);
    /**
     * n週目に採掘されたチャンク数を求める
     * @param {number} n n
     * @return {number}
     */
    const calc_mined_chunk_num_at_n = n => (1 === n) ? 1 : (2 * n + 1) / 4;
    /**
     * xチャンク採掘した時に採掘されたダイヤ鉱石数を求める
     * @param {number} chunk 採掘したチャンク数
     * @param {number} expected_dia_ore_num_per_chunk 1チャンクあたりのダイヤ鉱石存在量
     * @param {number} extra_dia_factor 洞窟やほか鉱石採掘中に見つかるダイヤのための補正係数
     * @return {number}
     */
    const calc_dia_ore_num = (chunk, expected_dia_ore_num_per_chunk, extra_dia_factor) =>
        ((16 * 4 * 8) / (16 * 16 * 12)) * expected_dia_ore_num_per_chunk * extra_dia_factor * chunk;
    /**
     * ダイヤ鉱石数を採掘したときのダイヤ取得数
     * @param {number} dia_ore_n ダイヤ鉱石数
     * @param {number} fortune_factor 幸運エンチャントを考慮したダイヤ鉱石1個あたりのダイヤ取得数係数
     * @return {number}
     */
    const calc_dia_num = (dia_ore_n, fortune_factor) => dia_ore_n * fortune_factor;

    /**
     * 文字列を整数に変換する。ただし数値が入ってきたら単にそれを返す。
     * @param {any} v value
     * @return {number} NaN とか Finiteかもしれない
     */
    const make_int_number = v => typeof(v) === "number" ? v : parseInt(v);

    /**
     * 文字列を整数に変換する。ただし数値が入ってきたら単にそれを返す。
     * @param {any} v value
     * @return {number} NaN とか Finiteかもしれない
     */
    const make_float_number = v => typeof(v) === "number" ? v : parseFloat(v);

    class Data {
        constructor() {
            this.n = 0;
            this.mined_chunk_num = 0;
            this.dia_ore_num = 0;
            this.dia_num = 0;
            this.expected_dia_ore_num_per_chunk = 3.67;
            /** @type {number} */
            this.fortune_factor = 1.0;
            /** @type {number} */
            this.extra_dia_factor = default_pure_extra_dia_factor;
            /**
             * 0ならn週目までに、1ならn週目について計算を行う
             * @type {number}
             */
            this.mode = 0;
        }
        update_dia_num_() {
            this.dia_num = calc_dia_num(this.dia_ore_num, this.fortune_factor);
        }
        /**
         * ダイヤ取得数係数を変更する
         * @param {number|string} fortune_factor 幸運エンチャントを考慮したダイヤ鉱石1個あたりのダイヤ取得数係数
         */
        set_fortune_factor(fortune_factor) {
            fortune_factor = make_float_number(fortune_factor);
            if (this.fortune_factor !== fortune_factor) {
                this.fortune_factor = fortune_factor;
                this.update_dia_num_();
            }
        }
        update_dia_ore_num_() {
            this.dia_ore_num = calc_dia_ore_num(
                this.mined_chunk_num,
                this.expected_dia_ore_num_per_chunk,
                this.extra_dia_factor
            );
            this.update_dia_num_();
        }
        /**
         * 1チャンクあたりのダイヤ鉱石存在量を変更する
         * @param {number|string} expected_dia_ore_num_per_chunk 1チャンクあたりのダイヤ鉱石存在量
         */
        set_expected_dia_ore_num_per_chunk(expected_dia_ore_num_per_chunk) {
            expected_dia_ore_num_per_chunk = make_float_number(expected_dia_ore_num_per_chunk);
            if (this.expected_dia_ore_num_per_chunk !== expected_dia_ore_num_per_chunk) {
                this.expected_dia_ore_num_per_chunk = expected_dia_ore_num_per_chunk;
                this.update_dia_ore_num_();
            }
        }
        /**
         * 他鉱石の影響を補正済みのダイヤのための補正係数を変更する
         * @param {number|string} extra_dia_factor 他鉱石の影響を補正済みのダイヤのための補正係数
         */
        set_extra_dia_factor(extra_dia_factor) {
            extra_dia_factor = make_float_number(extra_dia_factor);
            if (this.extra_dia_factor !== extra_dia_factor) {
                this.extra_dia_factor = extra_dia_factor;
                this.update_dia_ore_num_();
            }
        }
        update_mined_chunk_num_() {
            this.mined_chunk_num = (0 === this.mode)
                ? calc_mined_chunk_num_until_n(this.n)
                : calc_mined_chunk_num_at_n(this.n);
            this.update_dia_ore_num_();
        }
        /**
         * 風車型周回数を変更する
         * @param {number|string} n 風車型周回数
         */
        set_n(n) {
            n = make_int_number(n);
            if (this.n !== n) {
                this.n = n;
                this.update_mined_chunk_num_();
            }
        }
        /**
         * 計算モードを変更する
         * @param {number|string} mode 0ならn週目までに、1ならn週目について計算を行う
         */
        set_mode(mode) {
            mode = make_int_number(mode);
            if (this.mode !== mode) {
                this.mode = mode;
                this.update_mined_chunk_num_();
            }
        }
    }

    class OreEffect {
        /**
         * @param {string} ore 鉱石名
         */
        constructor(ore) {
            this.enabled = false;
            /** @type {number} */
            this.effect_factor = default_extra_dia_factor_by_other_ores[ore];
        }
    }

    /**
     * 鉱石の影響寄与の総和を求める
     * @param {Map<string, OreEffect>} ores_effect_map 鉱石の影響寄与のマップ
     * @return {number}
     */
    const calc_ores_effect_sum = ores_effect_map => {
        let ores_effect_sum = 0;
        for (const e of ores_effect_map.values()) {
            if (e.enabled) {
                ores_effect_sum += e.effect_factor;
            }
        }
        return ores_effect_sum;
    };


    class Calculator {
        constructor(/* vnode */) {
            this.data = new Data();
            this.pure_extra_dia_factor = default_pure_extra_dia_factor;
            this.fortune_level = 0;
            /** @type {Map<string, OreEffect>} */
            this.other_ores_effect = new Map();
            ore_list.map(ore => {
                this.other_ores_effect.set(ore, new OreEffect(ore));
            });
        }
        set_extra_dia_factor_() {
            this.data.set_extra_dia_factor(this.pure_extra_dia_factor + calc_ores_effect_sum(this.other_ores_effect));
        }
        view() {
            /**
             * number_validiaterに使うcheck関数型
             * @callback to_number_function
             * @param {any} value
             * @return {number}
             */
            /**
             * number_validiaterに使うcheck関数型
             * @callback number_validiater_check_function
             * @param {any} value
             * @return {boolean}
             */
            /**
             * number_validiaterで成功時に実行する関数型
             * @callback number_validiater_on_success_function
             * @param {any} value
             * @return {boolean}
             */
            /**
             * number_validiaterで成功時に実行する関数型
             * @callback number_validiater
             * @param {Event} e event
             */

            /**
             * number型を検証するvalidiaterを作る
             * @param {string} attr_name
             * @param {to_number_function} to_number_func numberに変換する関数
             * @param {number_validiater_check_function} chcker check関数
             * @param {number_validiater_on_success_function} on_success checkがtrueを返した時に実行する関数
             * @return {number_validiater}
             */
            const make_number_validiater = (attr_name, to_number_func, chcker, on_success) => {
                return (e) => {
                    const v = (attr_name in e.currentTarget)
                        ? e.currentTarget[attr_name]
                        : e.currentTarget.getAttribute(attr_name);
                    if (isNaN(v)) return;
                    /** @type {number} */
                    const n = to_number_func(v);
                    if (Number.isNaN(n) || !chcker(n)) return;
                    on_success(n);
                };
            };
            return m("div", [
                m("section", [
                    m("h3", "計算モード"),
                    m(
                        "select",
                        {"onchange": m.withAttr("selectedIndex", this.data.set_mode, this.data)},
                        calc_mode_list.map((item, i) => m("option", {"selected": this.data.mode === i}, item))
                    )
                ]),
                m("section", [
                    m("h3", "風車型周回数"),
                    m("div", [
                        m("input", {
                            "type": "number",
                            "oninput": m.withAttr("value", this.data.set_n, this.data),
                            "value": this.data.n,
                            "min": 0
                        }),
                        m("a", "周")
                    ])
                ]),
                m("section", [
                    m("h3", "1チャンクあたりのダイヤ鉱石存在量"),
                    m("input", {
                        "type": "text",
                        "oninput": make_number_validiater(
                            "value",
                            make_float_number,
                            n => 0 <= n,
                            this.data.set_expected_dia_ore_num_per_chunk
                        ),
                        "value": this.data.expected_dia_ore_num_per_chunk,
                        "pattern": /(0|\d{1,}\.\d*)/.source
                    })
                ]),
                m("section", [
                    m("h3", "洞窟やほか鉱石採掘中に見つかるダイヤのための補正係数"),
                    m("section", [
                        m("h4", "ダイヤのみの補正係数"),
                        m("input", {
                            "type": "text",
                            "oninput": make_number_validiater(
                                "value",
                                make_float_number,
                                n => 0 <= n && this.pure_extra_dia_factor !== n,
                                correction_value => {
                                    this.pure_extra_dia_factor = correction_value;
                                    this.set_extra_dia_factor_();
                                }
                            ),
                            "value": this.pure_extra_dia_factor,
                            "pattern": /(0|\d{1,}\.\d*)/.source
                        })
                    ]),
                    m("section", [
                        m("h4", "その他の鉱石からの補正係数"),
                        m("table", [
                            m("thead", m("tr", [m("td", "有効/無効"), m("td", "鉱石名"), m("td", "補正値")])),
                            m("tbody", ore_list.map(ore => m("tr", [
                                m("td", m("label", m("input", {
                                    "type": "checkbox",
                                    "onchange": m.withAttr("checked", check_state => {
                                        if (this.other_ores_effect.get(ore).enabled !== check_state) {
                                            this.other_ores_effect.get(ore).enabled = check_state;
                                            this.set_extra_dia_factor_();
                                        }
                                    }),
                                    "checked": this.other_ores_effect.get(ore).enabled
                                }))),
                                m("td", translate_ja[ore]),
                                m("td", m("input", {
                                    "type": "text",
                                    "oninput": make_number_validiater(
                                        "value",
                                        make_float_number,
                                        n => 0 <= n && this.other_ores_effect.get(ore).effect_factor !== n,
                                        correction_value => {
                                            this.other_ores_effect.get(ore).effect_factor = correction_value;
                                            this.set_extra_dia_factor_();
                                        }
                                    ),
                                    "value": this.other_ores_effect.get(ore).effect_factor,
                                    "disabled": !this.other_ores_effect.get(ore).enabled,
                                    "pattern": /(0|\d{1,}\.\d*)/.source
                                }))
                            ])))
                        ])
                    ])
                ]),
                m("section", [
                    m("h3", "幸運エンチャントの寄与"),
                    m(
                        "select",
                        {"onchange": m.withAttr("selectedIndex", i => {
                            this.fortune_level = i;
                            this.data.set_fortune_factor(fortune_factors[i]);
                        })},
                        fortune_factors_text.map(
                            (text, i) => m("option", {"selected": this.fortune_level === i}, text)
                        )
                    )
                ]),
                m("section", [
                    m("h3", "計算結果"),
                    m("ul", [
                        m("li", `採掘チャンク数: ${this.data.mined_chunk_num}`),
                        m("li", `採掘ダイヤ鉱石数: ${this.data.dia_ore_num}`),
                        m("li", `採掘ダイヤ数: ${this.data.dia_num}`)
                    ])
                ])
            ]);
        }
    }

    const main = () => {
        m.mount(document.getElementById("calc_main"), Calculator);
    };

    if (document.readyState !== "loading") {
        main();
    } else {
        document.addEventListener("DOMContentLoaded", main);
    }
})();
