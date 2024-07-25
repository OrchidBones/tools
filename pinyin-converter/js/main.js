$(document).ready(()=>{
    $("button#do").click(()=>{
        const ori = $("textarea#imp").val();
        const target = pinyinUtil.getPinyin(ori);
        $("textarea#exp").val(target);
    });

    $("button#clear").click(()=>{
        $("textarea#imp").val("");
        $("textarea#exp").val("");
    })
});
