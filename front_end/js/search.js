var KEYCODE_ENTER = 13;

// 搜歌相关
var result_song = null;

function search_song(search_word) {
    parent.Tools.toast("搜索中...");
    $("#search-tips").css("display", "none");
    $("#search-result").css("display", "block");

    $(".mui-loading").css("display", "block");
    $(".mui-slider-group ul").css("display", "none");

    parent.AudioManager.NET.searchSong({
        data: {
            search_keyword: search_word
        },
        error: (req, err, except) => {
            parent.mui.toast("网络异常，请检查后重试");
        },
        success: (data, text) => {
            if (data.songs) {
                for (let i = 0; i < data.songs.length; i++) {
                    data.songs[i].song_name = data.songs[i].song_name.replace("<em>", "").replace("</em>",
                        "")
                    data.songs[i].singer_name = data.songs[i].singer_name.replace("<em>", "").replace(
                        "</em>", "")
                }
                result_song = data.songs;
                renewResultList_song();
            }
        },
        complete: (dta, text) => {
            parent.Tools.closeToast();
        }
    });
}

function renewResultList_song() {
    $("#item1mobile ul").empty();
    $(".mui-slider-group ul").css("display", "block");
    for (let i = 0; i < result_song.length; i++) {
        $("#item1mobile ul").append(
            '<li class="mui-table-view-cell single-item song-item" id=' + i + ' >' +
            '    <div class="mui-media-body">' +
            '        <h1>' + result_song[i].song_name + '</h1>' +
            '        <span class="mui-icon mui-icon-more"></span>' +
            '        <p class="mui-ellipsis">' + result_song[i].singer_name + '</p>' +
            '    </div>' +
            '</li>'
        )
    }
    $(".mui-loading").css("display", "none");

    $(".song-item").bind(parent.tap, (event) => {
        event.stopPropagation();
        $("#song-item-menu ul")[0].setAttribute("id", event.currentTarget.id);
        if ($("#song-item-menu li").length == 0)
            mui.toast("您未创建过歌单，无法收藏")
        else
            mui("#song-item-menu").popover('show');
    });
}

// 搜人相关

var result_user = null;

function search_user(username) {
    $("#user-result").css("display", "none");
    parent.UserManager.searchUser({
        data: {
            username: username
        },
        error: () => {
            mui.toast("网络异常，请稍后重试")
        },
        success: (data) => {
            $("#item2mobile .mui-loading").remove();
            if (data == "no user") {
                $("#item2mobile").append("<p class='no-user'>无此用户</p>")
            } else {
                result_user = data;
                $("#user-item-name").text(result_user.username);
                $("#user-item-info span").text(result_user.musiclists.length);
                if (!parent.UserManager.isLogin() ||
                    result_user.username == parent.UserManager.userInfo.username)
                    $("#user-follow").remove();
                $("#user-result").css("display", "block");
            }
        }
    });
}

window.onload = function() {
    mui.init({
        swipeBack: false
    });
    mui('.mui-scroll-wrapper').scroll();

    // 页面初始化
    $("#search-tips").css("display", "block");
    $("#search-result").css("display", "none");
    $("#search-input input").focus();

    loadHistory();

    // 返回按键
    $(".nav-back").bind(parent.tap, () => {
        parent.PageManager.reBack();
    });

    // 搜索框
    $("#search-input input").bind('keypress', (event) => {
        if (event.keyCode == KEYCODE_ENTER)
            if ($("#search-input input").val() != "") {
                search_song($("#search-input input").val())
                search_user($("#search-input input").val())
            } else {
                $("#search-input input")[0].blur();
                loadHistory();
                $("#search-tips").css("display", "block");
                $("#search-result").css("display", "none");
                mui.toast("搜索词为空")
            }
    });

    // 搜索状态下
    $(".search-history-list li").bind(parent.tap, (event) => {
        $("#search-input input").val($(event.currentTarget).find("a")[0].textContent)
        search_song($(event.currentTarget).find("a")[0].textContent)
        search_user($(event.currentTarget).find("a")[0].textContent)
    });
    $(".hot-search-lists li").bind(parent.tap, (event) => {
        $("#search-input input").val(event.currentTarget.textContent)
        search_song(event.currentTarget.textContent)
        search_user(event.currentTarget.textContent)
    });

    // 搜索结果：歌曲操作
    $("#song-item-menu ul").empty();
    parent.AudioManager.musicLists.forEach((item) => {
        console.log(item)
        $("#song-item-menu ul").append('<li class="mui-table-view-cell" id=' + item.id +
            '>收藏到歌单：<span>' + item.name + '</span></li>')
    });

    $("#song-item-menu li").bind(parent.tap, (event) => {
        mui("#song-item-menu").popover('hide');
        parent.Tools.toast(" 添加中...");
        var song = result_song[event.currentTarget.parentNode.id];
        parent.AudioManager.NET.addMusicToList({
            data: {
                list_id: event.currentTarget.id,
                song_name: song.song_name,
                singer: song.singer_name,
                song_hash: song.fileHash,
                img: song.img,
                mp3: song.mp3,
                song_word: song.lyrics
            },
            error: () => {
                mui.toast("网络异常，请重试");
            },
            success: (data) => {
                if (data == "ok")
                    mui.toast("添加成功");
                else
                    mui.toast("添加失败");
            },
            complete: () => {
                parent.Tools.closeToast();
            }
        })
    });

    // 搜索结果：人操作
    $("#user-result").bind(parent.tap, (event) => {
        parent.PageManager.values = result_user;
        parent.PageManager.open("pages/personalCenter.html");
    });

    $("#user-follow").bind(parent.tap, (event) => {
        event.stopPropagation();
        if (event.currentTarget.disabled) return;
        if (parent.UserManager.isLogin()) {
            mui("#user-follow").button('loading');
            parent.UserManager.focusUser({
                data: {
                    oriUsername: parent.UserManager.userInfo.username,
                    targetUsername: result_user.username
                },
                error: () => {
                    mui.toast("网络异常，请重试")
                    mui("#user-follow").button('reset');
                },
                success: (data) => {
                    console.log(data)
                    mui.toast("关注成功");
                    $("#user-follow").remove();
                }
            })
        } else {
            mui.toast("未登录");
            $("#user-follow").remove();
        }
    })

    // 清空历史
    $("#clear-history").bind(parent.tap, (event) => {
        $(".search-history-list").empty();
        parent.AudioManager.NET.clearSearchHistory();
    });

    // 删除某一历史
    $(".delete-icon").bind(parent.tap, (event) => {
        event.stopPropagation();
        $(event.currentTarget.parentNode).remove();
        console.log($(event.currentTarget.parentNode).find("a").textContent)
    });
}

function loadHistory() {
    $(".search-history-list").empty();
    parent.AudioManager.NET.insertSearch_history({
        options: "server"
    });
    for (let i = 0; i < parent.AudioManager.search_history.length; i++) {
        $(".search-history-list").append(
            '<li class="mui-table-view-cell">' +
            '    <a>' + parent.AudioManager.search_history[i] + '</a>' +
            '    <span class="mui-icon mui-icon-closeempty delete-icon"></span>' +
            '</li>'
        );
    }
}
