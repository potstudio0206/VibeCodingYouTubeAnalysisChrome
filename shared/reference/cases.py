# -*- coding: utf-8 -*-
"""基準データ（golden）の入力ケース。期待値は metrics_ref.py が計算する。

ケースを追加・変更したら、metrics_ref.py --write-golden を実行して基準データを作り直すこと。
"""


# ---------------------------------------------------------------- 2章 読み取りのケース
def _act(ms, kind, rid=None, message=None, extra_actions=None):
    r = {}
    if rid is not None:
        r["id"] = rid
    if message is not None:
        r["message"] = message
    acts = [{"addChatItemAction": {"item": {kind: r}}}]
    if extra_actions:
        acts = extra_actions + acts
    rep = {"actions": acts}
    if ms is not None:
        rep["videoOffsetTimeMsec"] = ms
    return {"replayChatItemAction": rep}


def _runs(*parts):
    return {"runs": list(parts)}


T = "liveChatTextMessageRenderer"


def parse_cases():
    return [
        {
            "name": "renderer_kinds_and_text",
            "description": "レンダラーの種類分け、runs/simpleText/絵文字の本文化、対象外の種類を捨てること",
            "actions": [
                _act("100", "liveChatViewerEngagementMessageRenderer", "sys1", _runs({"text": "ようこそ"})),
                {"clickTrackingParams": "not-a-replay-action"},
                _act("1500", T, "t1", _runs({"text": "こんにちは"})),
                _act("2000", T, "t2", _runs({"text": "草"}, {"emoji": {"emojiId": "UCabc/xyz", "isCustomEmoji": True,
                                                                       "shortcuts": [":_kusa:", ":kusa:"]}})),
                _act("2500", T, "t3", _runs({"emoji": {"emojiId": "😂"}})),
                _act("2600", T, "t4", _runs({"text": ""}, {"emoji": {"emojiId": "👏"}})),
                _act("2700", T, "t5", _runs({"emoji": {"isCustomEmoji": True, "shortcuts": []}}, {"text": "!"})),
                _act("3000", T, "t6", {"simpleText": "8888"}),
                _act("3100", T, "t7", {"simpleText": "", "runs": [{"text": "runsが使われる"}]}),
                _act("4000", "liveChatPaidMessageRenderer", "p1", _runs({"text": "おめでとう"})),
                _act("4100", "liveChatPaidMessageRenderer", "p2"),
                _act("4200", "liveChatPaidStickerRenderer", "p3"),
                _act("5000", "liveChatMembershipItemRenderer", "m1", _runs({"text": "メンバー歴 1か月"})),
                _act("5100", "liveChatSponsorshipsGiftPurchaseAnnouncementRenderer", "m2"),
                _act("6000", T, "t8", _runs({"text": "削除操作と同居"}),
                     extra_actions=[{"markChatItemAsDeletedAction": {"targetItemId": "zzz"}}]),
                _act("6100", T, "t9"),
            ],
        },
        {
            "name": "time_rules",
            "description": "時刻が無い・空・数値でない・負は捨てる。丸めない。昇順に並べ、同時刻は出現順を保つ",
            "actions": [
                _act(None, T, "x1", _runs({"text": "時刻なし"})),
                _act("", T, "x2", _runs({"text": "空文字"})),
                _act("-100", T, "x3", _runs({"text": "負"})),
                _act("abc", T, "x4", _runs({"text": "数値でない"})),
                _act("9000", T, "y1", _runs({"text": "後"})),
                _act(61234, T, "y2", _runs({"text": "数値型"})),
                _act("0", T, "y3", _runs({"text": "先頭"})),
                _act("12345", T, "y4", _runs({"text": "丸めない"})),
                _act("29999", T, "y5", _runs({"text": "境界の直前"})),
                _act("7000", T, "y6", _runs({"text": "同時刻1"})),
                _act("7000", T, "y7", _runs({"text": "同時刻2"})),
            ],
        },
        {
            "name": "dedupe_by_id",
            "description": "同じidは最初の1件だけ残す（時刻が違っても）。idが無い項目は重複扱いしない",
            "actions": [
                _act("1000", T, "a1", _runs({"text": "x"})),
                _act("1000", T, "a1", _runs({"text": "x"})),
                _act("2000", T, "a1", _runs({"text": "別の時刻でも同じid"})),
                _act("3000", T, None, _runs({"text": "idなし"})),
                _act("3000", T, None, _runs({"text": "idなし"})),
            ],
        },
        {
            "name": "long_text_not_truncated",
            "description": "本文は切り詰めない（切り詰めは正規化でのみ行う）",
            "actions": [
                _act("1000", T, "l1", _runs({"text": "w" * 120 + "草" + "あ" * 40})),
                _act("1500", T, "l2", _runs({"text": "😂" * 50})),
            ],
        },
    ]


# ---------------------------------------------------------------- 3章 計算のケース
def _spread(bin_index, n, bin_sec, texts, typ="text"):
    """区間 bin_index に n 件を等間隔で置く。texts は順に繰り返す"""
    out = []
    for k in range(n):
        t = bin_index * bin_sec + (k + 0.5) * bin_sec / n
        out.append([round(t, 3), typ, texts[k % len(texts)]])
    return out


def metrics_cases():
    cases = []

    cases.append({
        "name": "empty",
        "description": "コメントが無い。区間数は動画の長さから決まる",
        "duration": 120, "bin_sec": 30, "items": [],
    })

    cases.append({
        "name": "basic_mixed",
        "description": "種類（member は数えない）、正規化（NFKC・小文字・空白・連続文字）、本文なしのスパチャ、負の時刻、動画の長さ以降の項目",
        "duration": 150, "bin_sec": 30,
        "items": [
            [-5.0, "text", "負の時刻は数えない"],
            [1.0, "text", "草"], [2.0, "text", "草"], [3.0, "text", "ｗｗｗｗ"],
            [4.0, "text", "wwwwww"], [5.0, "text", "WWWWWWW"], [6.0, "text", "こんにちは"],
            [7.0, "member", ""],
            [31.0, "text", "888"], [32.0, "text", "８８８８８"], [33.0, "text", "88888"],
            [34.0, "text", "a"], [35.0, "money", ""],
            [61.0, "text", "  草  草 "], [62.0, "text", "草 草"], [63.0, "text", "草　草"],
            [64.0, "text", "x"], [65.0, "text", "y"],
            [91.0, "text", "z"], [92.0, "text", "z"],
            [121.0, "money", "おめでとう"], [150.0, "text", "ちょうど終わり"], [200.0, "text", "長さより後"],
        ],
    })

    cases.append({
        "name": "same_rate_threshold",
        "description": "件数5未満、または最多のコメントが3件未満なら0",
        "duration": 90, "bin_sec": 30,
        "items": (_spread(0, 4, 30, ["a"])
                  + _spread(1, 5, 30, ["b", "b", "c", "c", "d"])
                  + _spread(2, 5, 30, ["e", "e", "e", "f", "g"])),
    })

    # 平常10件前後、途中で急増・急減する40区間
    burst = []
    base_counts = [10, 12, 9, 11, 10, 13, 8, 10, 11, 9]
    for i in range(40):
        c = base_counts[i % len(base_counts)]
        texts = ["こんばんは", "それな", "わかる", "なるほど", "かわいい", "がんばれ"]
        if i == 15:
            c, texts = 60, ["草"] * 5 + ["すごい"]
        elif i == 16:
            c, texts = 80, ["草"] * 3 + ["www", "wwww"]
        elif i == 17:
            c = 20
        elif i == 30:
            c = 0
        burst += _spread(i, c, 30, texts)
    cases.append({
        "name": "burst_accel",
        "description": "急増・急減と移動中央値（前後10区間、端では短い窓）",
        "duration": 1200, "bin_sec": 30, "items": burst,
    })

    cases.append({
        "name": "duration_unknown",
        "description": "動画の長さが不明（0）のときは最後の項目の時刻を使う",
        "duration": 0, "bin_sec": 30,
        "items": _spread(0, 3, 30, ["a"]) + [[95.5, "text", "最後"]],
    })

    cases.append({
        "name": "bin60",
        "description": "区間の長さ60秒",
        "duration": 600, "bin_sec": 60,
        "items": sum((_spread(i, n, 60, ["8888", "８８８８", "ナイス"]) for i, n in
                      enumerate([3, 7, 7, 15, 2, 0, 9, 9, 30, 4])), []),
    })

    cases.append({
        "name": "long_text_key",
        "description": "長い本文も切り詰めずに正規化する（連続文字の圧縮が先、30文字の切り詰めが後）",
        "duration": 30, "bin_sec": 30,
        "items": [[1.0, "text", "w" * 100 + "草"], [2.0, "text", "www草"], [3.0, "text", "wwwww草"],
                  [4.0, "text", "別"], [5.0, "text", "もう一つ"]],
    })

    head = "😂あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへ"   # 30コードポイント
    cases.append({
        "name": "truncate_30_codepoints",
        "description": "判定キーは先頭30コードポイント（絵文字も1文字）",
        "duration": 30, "bin_sec": 30,
        "items": [[1.0, "text", head + "X"], [2.0, "text", head + "Y"], [3.0, "text", head + "Zで違う"],
                  [4.0, "text", "別1"], [5.0, "text", "別2"]],
    })

    cases.append({
        "name": "edge_floor",
        "description": "平常時の量の下限1（中央値が0でも1で割る）",
        "duration": 90, "bin_sec": 30,
        "items": _spread(2, 7, 30, ["q"]),
    })

    return cases
