/**
*  功能：js简单弹窗
*  作者：小莫唐尼
*  邮箱：studio@925i.cn
*  时间：2022年03月08日 00:11:50
*  版本：v0.1.0
*  修改记录：
*  修改内容：重构代码
*  修改人员：小莫唐尼
*  修改时间：2022年03月11日 10:15:23
*/

(function () {
    'use strict';

    // 存储管理
    const StorageManager = {
        set(key, value) {
            localStorage.setItem(key, JSON.stringify(value));
        },
        get(key) {
            let r = localStorage.getItem(key);
            return r == null ? null : JSON.parse(r);
        }
    };

    // 状态管理
    const StatusManager = {
        // 样式标记（是否已经添加到了head 中）
        style: {
            key: 'TZALERT_IS_APPEND_STYLE',
            fnGetAppend() {
                let r = StorageManager.get(this.key);
                return r == null ? false : r;
            },
            fnSetAppend(is) {
                StorageManager.set(this.key, is);

            }
        }
    };

    // 默认清除状态标记
    StatusManager.style.fnSetAppend(false);

    // 随机工具
    const RandomHepler = {
        randerIdKey: '',
        // 生成随机的id
        fnCenerateRandomId() {
            // 取时间戳作为id后缀
            const RandomIdKey = new Date().getTime();
            this.randerIdKey = RandomIdKey
        }
    };

    // 管理定时器
    const Timeout = {
        close: null,
        okTips: null,
    };

    // 工具
    const Utils = {
        // 深度合并
        fnDeepMerge(obj1, obj2, filter = []) {
            let key;
            for (key in obj2) {
                if (filter.includes(key)) continue;
                obj1[key] =
                    obj1[key] &&
                        obj1[key].toString() === "[object Object]" &&
                        (obj2[key] && obj2[key].toString() === "[object Object]")
                        ? this.fnDeepMerge(obj1[key], obj2[key], [])
                        : (obj1[key] = obj2[key]);
            }
            return obj1;
        },
        fnObjToString(obj) {
            let s = '';
            for (let key in obj) {
                s += `${key}:${obj[key]};`
            }
            return s;
        }
    };

    // html helper
    const HtmlHelper = {
        buttonHtml(type, style, content) {
            switch (type) {
                case 'confirm':
                    return `<button class="alert-btn" id="AlertConfirm${RandomHepler.randerIdKey}" style="${style}">${content}</button>`;
                case 'cancel':
                    return `<button class="alert-btn" id="AlertCancel${RandomHepler.randerIdKey}" style="${style}">${content}</button>`;
            }
        },
        // 设置dom状态
        fnSetDom(ctx, elName, show, html = '') {
            if (show) {
                ctx.el[elName] && (ctx.el[elName].style.display = 'flex');
                ctx.el[elName] && (ctx.el[elName].innerHTML = (ctx.options[elName].html || '') + html);
            } else {
                ctx.el[elName] && (ctx.el[elName].style.display = 'none');
            }
        },
        // 非首次且重新配置后渲染
        diffRenderHtml(ctx) {
            // 获取样式 ：解构赋值es6
            const { alertStyle, titleStyle, contentStyle, tipsStyle,
                okTipsStyle, bottomStyle, confirmStyle, cancelStyle, maskStyle } = this.fnGetStyles(ctx);
            // 设置样式
            ctx.el.alert.style = alertStyle;
            ctx.el.title.style = titleStyle;
            ctx.el.content.style = contentStyle;
            ctx.el.tips.style = tipsStyle;
            ctx.el.okTips.style = okTipsStyle;
            ctx.el.bottom.style = bottomStyle;
            ctx.el.mask && (ctx.el.mask.style = maskStyle);

            // 控制状态
            let showTitle = ctx.options.title.html != '';
            let showContent = ctx.options.content.html != '';
            let showTips = ctx.options.tips.html != '';
            let showBottom = ctx.options.bottom.html != '';

            if (!showBottom) {
                showBottom = ctx.options.confirm.use || ctx.options.cancel.use;
            }
            let _defaultBtnHtml = '';
            if (ctx.options.cancel.use) {
                _defaultBtnHtml += HtmlHelper.buttonHtml('cancel', cancelStyle, ctx.options.cancel.text);
            }
            if (ctx.options.confirm.use) {
                _defaultBtnHtml += HtmlHelper.buttonHtml('confirm', confirmStyle, ctx.options.confirm.text);
            }
            HtmlHelper.fnSetDom(ctx, 'title', showTitle);
            HtmlHelper.fnSetDom(ctx, 'content', showContent);
            HtmlHelper.fnSetDom(ctx, 'tips', showTips);
            HtmlHelper.fnSetDom(ctx, 'bottom', showBottom, _defaultBtnHtml);

            this.fnCreateMask(ctx); // 遮罩层

            ctx.el.confirm = document.getElementById(`AlertConfirm${RandomHepler.randerIdKey}`); // 需要重新获取dom
            ctx.el.cancel = document.getElementById(`AlertCancel${RandomHepler.randerIdKey}`);   // 需要重新获取dom

            EventHandler.fnBindEvents(ctx);

            if (ctx.options.onMounted && typeof ctx.options.onMounted === 'function') {
                ctx.options.onMounted();
            }
            ctx.status.show = true;
        },
        // 创建遮罩层
        fnCreateMask(ctx) {
            ctx.el.mask && ctx.el.mask.remove();
            // 遮罩层
            if (ctx.options.mask.use) {
                const { maskStyle } = this.fnGetStyles(ctx);
                const mask = document.createElement('div');
                mask.setAttribute('id', `AlertMask${RandomHepler.randerIdKey}`);
                mask.className = 'alert-mask';
                mask.style = maskStyle;
                document.body.appendChild(mask);
                ctx.el.mask = document.getElementById(`AlertMask${RandomHepler.randerIdKey}`);
                // 监听事件
                if (ctx.options.useMaskClose) {
                    mask.onclick = function (e) {
                        e.preventDefault();
                        ctx.close();
                    };
                } else {
                    mask.onclick = null;
                }
            }
        },
        // 获取样式
        fnGetStyles(ctx) {
            let alertStyle = {
                width: ctx.options.width,
                top: ctx.options.top,
                'box-shadow': ctx.options.shadow,
                'border-radius': ctx.options.radius,
                'margin-left': - ctx.options.width.replace('px', '') / 2 + 'px',
            };
            let titleStyle = {
                'justify-content': ctx.options.center ? 'center' : 'flex-start',
                'font-size': ctx.options.title.fontSize,
                'font-weight': ctx.options.title.fontWeight,
                'color': ctx.options.title.color,
            };
            let contentStyle = {
                'padding': ctx.options.content.padding,
                'justify-content': ctx.options.center ? 'center' : 'flex-start',
            };
            let tipsStyle = {
                'font-size': ctx.options.tips.fontSize,
                'font-weight': ctx.options.tips.fontWeight,
                'color': ctx.options.tips.color,
                'justify-content': ctx.options.center ? 'center' : 'flex-start',
            };
            let okTipsStyle = {
                'text-align': ctx.options.center ? 'center' : 'inherit',
            };
            let bottomStyle = {
                'justify-content': ctx.options.center ? 'center' : 'flex-end',
            };
            let confirmStyle = {
                '--textColor': ctx.options.confirm.textColor,
                '--bgColor': ctx.options.confirm.bgColor,
                '--shadow': ctx.options.confirm.shadow,
                'border-radius': ctx.options.confirm.radius,
                padding: ctx.options.confirm.padding,
                border: ctx.options.confirm.border,
            };
            let cancelStyle = {
                '--textColor': ctx.options.cancel.textColor,
                '--bgColor': ctx.options.cancel.bgColor,
                '--shadow': ctx.options.cancel.shadow,
                'border-radius': ctx.options.cancel.radius,
                padding: ctx.options.cancel.padding,
                border: ctx.options.cancel.border,
            };

            let maskStyle = {
                width: '100vw',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                background: ctx.options.mask.background,
            };

            alertStyle = Utils.fnObjToString(alertStyle);
            titleStyle = Utils.fnObjToString(titleStyle);
            contentStyle = Utils.fnObjToString(contentStyle);
            tipsStyle = Utils.fnObjToString(tipsStyle);
            okTipsStyle = Utils.fnObjToString(okTipsStyle);
            bottomStyle = Utils.fnObjToString(bottomStyle);
            confirmStyle = Utils.fnObjToString(confirmStyle);
            cancelStyle = Utils.fnObjToString(cancelStyle);
            maskStyle = Utils.fnObjToString(maskStyle);

            return {
                alertStyle, titleStyle, contentStyle, tipsStyle,
                okTipsStyle, bottomStyle, confirmStyle, cancelStyle, maskStyle
            };
        },
    };

    // 事件
    const EventHandler = {
        // 拖拽
        fnOnDrop(ctx) {
            const _alertWidth = Number(ctx.options.width.replace('px', ''));

            const alert = ctx.el.alert,
                title = ctx.el.title;

            let x, y; //鼠标相对与div左边，上边的偏移
            let isDrop = false; //移动状态的判断鼠标按下才能移动
            title.onmousedown = function (e) {
                title.style.cursor = 'move';
                var e = e || window.event; //要用event这个对象来获取鼠标的位置
                x = e.clientX - alert.offsetLeft - _alertWidth / 2;  // 矫正偏差限定左边距离
                y = e.clientY - alert.offsetTop; // -15 边距
                isDrop = true; //设为true表示可以移动
            };
            document.onmousemove = function (e) {
                //是否为可移动状态                　　　　　　　　　　　 　　　　　　　
                if (isDrop) {
                    var e = e || window.event;
                    var moveX = e.clientX - x; //得到距离左边移动距离                    　　
                    var moveY = e.clientY - y; //得到距离上边移动距离
                    //可移动最大距离
                    var maxX = document.documentElement.clientWidth - alert.offsetWidth + _alertWidth / 2;  // 矫正偏差限定左边距离
                    var maxY = document.documentElement.clientHeight - alert.offsetHeight;
                    //范围限定 
                    moveX = Math.min(maxX, Math.max(0, moveX));
                    moveY = Math.min(maxY, Math.max(0, moveY));
                    if (moveX > _alertWidth / 2) { // 矫正偏差限定左边距离
                        alert.style.left = moveX + "px";
                    }
                    alert.style.top = moveY + "px";
                } else {
                    return;
                }
            };
            document.onmouseup = function () {
                isDrop = false; //设置为false不可移动
                title.style.cursor = 'initial';
            };
        },

        // 绑定监听事件
        fnBindEvents: function (ctx) {
            const { alert, close, content, okTips, confirm, cancel } = ctx.el;   // es6
            // 确定按钮
            if (confirm) {
                confirm.onclick = function (e) {
                    e.preventDefault();
                    if (ctx.options.onEvents && typeof ctx.options.onEvents === 'function') {
                        ctx.options.onEvents({ confirm: true });
                    } else {
                        ctx.close();
                    }
                };
            }

            // 取消按钮
            if (cancel) {
                cancel.onclick = function (e) {
                    e.preventDefault();
                    if (ctx.options.onEvents && typeof ctx.options.onEvents === 'function') {
                        ctx.options.onEvents({ cancel: true });
                    } else {
                        ctx.close();
                    }
                };
            }
            if (ctx.options.copy.use) {
                // 复制
                const doCopy = function () {
                    const copyContent = ctx.options.copy.onlyText ? content.innerText : content.innerHTML;
                    navigator.clipboard.writeText(copyContent);
                    if (ctx.options.copy.useTips) {
                        okTips.innerText = '提示：内容复制成功，使用 [ ctrl + v ] 快捷键即可快速粘贴！';
                        clearTimeout(Timeout.okTips);
                        Timeout.okTips = setTimeout(function () {
                            okTips.innerText = '';
                        }, 3000)
                    }
                };

                if (ctx.options.copy.isDbClick) {
                    content.onclick = null;
                    content.ondblclick = function (e) {
                        e.preventDefault();
                        doCopy();
                    };
                } else {
                    content.ondblclick = null;
                    content.onclick = function (e) {
                        e.preventDefault();
                        doCopy();
                    };
                }
            } else {
                ctx.options.isDbClick && (content.ondblclick = null);
                !ctx.options.isDbClick && (content.onclick = null);
            }
            // 绑定关闭事件
            close.onclick = function (e) {
                e.preventDefault();
                ctx.close();
            };
            // 绑定监听拖拽事件
            if (ctx.options.useDrop) {
                this.fnOnDrop(ctx);
            }
        },
    };

    const TzAlert = function (options) {
        if (!(this instanceof TzAlert)) { return new TzAlert(options); }
        this.options = Utils.fnDeepMerge({
            width: '460px', // 弹窗宽度
            top: '20px',    // 距离顶部位置
            radius: '6px',  // 圆角
            shadow: '0 2px 10px rgba(0,0,0,0.2)', // 阴影
            async: false,   // 异步关闭
            asyncTime: 1000,// 延迟关闭时间
            center: false,  // 内容居中
            useDrop: true,  // 拖拽
            useMaskClose: true, // 点击遮罩层关闭
            useInitShow: false,      // 是否初始化完成后直接弹出
            copy: {
                use: true,
                onlyText: true,    // 是否仅复制文本，否则会复制dom元素
                useTips: true,
                isDbClick: true // 双击
            },
            confirm: {
                use: true,
                text: '确认',
                textColor: '#fff',
                bgColor: '#ff80ab',
                radius: '6px',
                border: '1px solid #ff80ab',
                shadow: '0px 1px 10px rgba(255, 128, 171, .4)',
                padding: '6px 15px',
            },
            cancel: {
                use: true,
                text: '取消',
                textColor: '#333',
                bgColor: '#fff',
                border: '1px solid #dcdfe6',
                radius: '6px',
                shadow: '0px 1px 3px rgba(144, 147, 153, .2)',
                padding: '6px 15px',
            },
            mask: {
                use: true,
                background: 'rgba(0,0,0,.3)'
            },
            title: {
                html: '',
                color: '',
                fontSize: '',
                fontWeight: '',
            },
            content: {
                html: '',
                padding: ''
            },
            tips: {
                html: '',
                color: '',
                fontSize: '',
                fontWeight: '',
            },
            bottom: {
                isCover: false, // 是否覆盖原本的按钮（如果原来按钮显示的话）
                show: true,
                html: '',
            },
            onClose: null,
            onEvents: null, // 内部的事件回调监听，传入的是一个函数  onEvents:function(callback){},
            onMounted: function () { }
        }, options);

        this.init();
    };

    TzAlert.prototype = {
        status: {
            show: false // 当前是否正在显示
        },
        el: {
            mask: null,
            alert: null,
            title: null,
            close: null,
            content: null,
            tips: null,
            okTips: null,
            bottom: null,
            confirm: null,
            cancel: null,
        },
        // 获取dom元素
        fnGetEles() {
            this.el.mask = document.getElementById(`AlertMask${RandomHepler.randerIdKey}`);
            this.el.alert = document.getElementById(`Alert${RandomHepler.randerIdKey}`);
            this.el.title = document.getElementById(`AlertTitle${RandomHepler.randerIdKey}`);
            this.el.close = document.getElementById(`AlertClose${RandomHepler.randerIdKey}`);
            this.el.content = document.getElementById(`AlertContent${RandomHepler.randerIdKey}`);
            this.el.tips = document.getElementById(`AlertTips${RandomHepler.randerIdKey}`);
            this.el.okTips = document.getElementById(`AlertOkTips${RandomHepler.randerIdKey}`);
            this.el.bottom = document.getElementById(`AlertBottom${RandomHepler.randerIdKey}`);
            this.el.confirm = document.getElementById(`AlertConfirm${RandomHepler.randerIdKey}`);
            this.el.cancel = document.getElementById(`AlertCancel${RandomHepler.randerIdKey}`);
        },
        // 打开事件
        open(options) {
            const _this = this;
            const doOpen = function () {
                const alert = _this.el.alert;
                alert.style.top = _this.options.top;
                alert.classList = 'alert-wrap is-visible';
                _this.status.show = true;
            };
            if (options) {
                _this.options = Utils.fnDeepMerge(_this.options, options, ['']);
                _this.options.onEvents = options.onEvents || null;
                if (!_this.options.mask.use && _this.status.show) {
                    _this.close();
                } else {
                    HtmlHelper.diffRenderHtml(_this);
                    doOpen();
                }
            } else {
                if (_this.options.mask.use) {
                    HtmlHelper.fnCreateMask(_this);
                }
                doOpen();
            }
        },
        // 关闭事件
        close() {
            clearTimeout(Timeout.close);
            clearTimeout(Timeout.okTips);

            const _this = this;
            const alert = _this.el.alert,
                okTips = _this.el.okTips,
                mask = _this.el.mask;
            okTips.innerText = '';

            const doCloseAndCallback = function () {
                alert.classList = 'alert-wrap no-visible';
                _this.status.show = false;
                if (mask) {
                    mask.style.display = 'none';
                }
                if (_this.options.onClose && typeof _this.options.onClose === 'function') {
                    _this.options.onClose();
                }
            };

            if (_this.options.async) {
                Timeout.close = setTimeout(function () {
                    doCloseAndCallback();
                }, _this.options.asyncTime);
            } else {
                doCloseAndCallback();
            }
        },
        // 初始化
        init() {
            const _this = this;

            // 初始化获取当前实例的id随机值
            RandomHepler.fnCenerateRandomId();

            // 控制状态
            let showTitle = this.options.title.html != '';
            let showContent = this.options.content.html != '';
            let showTips = this.options.tips.html != '';
            let showBottom = this.options.bottom.html != '';
            if (!showBottom) {
                showBottom = this.options.confirm.use || this.options.cancel.use;
            }

            // 获取样式 ：解构赋值es6
            const { alertStyle, titleStyle, contentStyle, tipsStyle,
                okTipsStyle, bottomStyle, confirmStyle, cancelStyle } = HtmlHelper.fnGetStyles(_this);

            // 创建遮罩层
            this.options.useInitShow && HtmlHelper.fnCreateMask(_this);

            // 添加容器样式
            if (!StatusManager.style.fnGetAppend()) {
                const $head = document.getElementsByTagName('head')[0];

                const elStyle = document.createElement('style');
                elStyle.innerHTML = `
                .alert-btn {
                    border-radius: 6px;
                    padding: 6px 15px;
                    background-color:var(--bgColor);
                    border: 1px solid var(--bgColor);
                    color: var(--textColor);
                    transition:box-shadow .1s ease-in-out,transform .1s ease-in-out;
                }
                .alert-btn:active,
                .alert-btn:hover{
                    box-shadow: var(--shadow);
                }
                .alert-btn:active{
                    transform: scale(.98);
                }
                .alert-btn + .alert-btn{
                    margin-left:10px;
                } 
                .alert-wrap{
                    min-width:300px;
                    position: fixed;
                    left: 50%;
                    top:10vh;
                    box-sizing: border-box;
                    padding: 15px 20px;
                    background-color: #fff;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, .2);
                    border-radius: 6px;
                    font-size: 14px;
                    z-index:9999;
                    color:#303133;
                }
                .alert-wrap.is-visible{
                    display:block;
                }
                .alert-wrap.no-visible{
                    visibility: hidden;
                    z-index:-1;
                    display:none;
                }
                .el-is-show{
                    display:block!important;
                }
                 .el-is-show-flex{
                    display:flex;
                    visibility: visible!important;
                }
                .el-is-hide{
                    visibility: hidden!important;
                }
                .alert-close{
                    position: absolute;
                    top: 5px;
                    right: 13px;
                    font-size: 26px;
                    color: #F56C6C;
                    transform: rotateZ(45deg);
                    user-select: none;
                    cursor: pointer;
                    transition:transform .1s ease-in-out;
                }
                .alert-close:hover{
                    transform:rotateZ(45deg) scale(1.1);
                }
                .alert-title{
                    user-select: none;
                    font-size: 15px;
                    font-weight: normal;
                    margin: 0;
                    margin-bottom: 15px;
                    color:#303133;
                }
                .alert-content{
                    box-sizing: border-box;
                    padding:10px 0;
                }
                .alert-tips {
                    user-select: none;
                    margin-top: 10px;
                    font-size: 12px; 
                    color:#909399;
                }
                .alert-copy-ok-tips{
                    font-size:12px;
                    user-select: none;
                    margin:10px 0;
                    color:#19be6b;
                }
                .alert-bottom {
                    user-select: none;
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: flex-end;
                    align-items: center;
                    margin-top: 20px;
                }
                .alert-wrap.is-center>.alert-title{
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: flex-end;
                    align-items: center;
                    text-align: center;
                }
                .alert-wrap.is-center>.alert-bottom{
                    text-align: center;
                }
            `;
                $head.appendChild(elStyle);
                StatusManager.style.fnSetAppend(true)
            }

            // 添加弹窗容器
            const $body = document.getElementsByTagName('body')[0];
            const elAlert = document.createElement('div');
            elAlert.className = 'alert-wrap  no-visible';
            elAlert.setAttribute('id', `Alert${RandomHepler.randerIdKey}`);
            elAlert.style = alertStyle;

            let _bottomHtml, alertConfirmBtn, alertCancelBtn;
            if (this.options.confirm.use) {
                alertConfirmBtn = HtmlHelper.buttonHtml('confirm', confirmStyle, _this.options.confirm.text);
            }
            if (this.options.cancel.use) {
                alertCancelBtn = HtmlHelper.buttonHtml('cancel', cancelStyle, _this.options.cancel.text);
            }
            if (this.options.bottom.html && this.options.bottom.show) {
                if (this.options.bottom.isCover) {
                    _bottomHtml = this.options.bottom.html;
                } else {
                    _bottomHtml = this.options.bottom.html + alertCancelBtn + alertConfirmBtn;
                }
            } else {
                _bottomHtml = alertCancelBtn + alertConfirmBtn;
            }
            elAlert.innerHTML = `
                <span class="alert-close" id="AlertClose${RandomHepler.randerIdKey}" title="关闭">+</span>
                <h5 class="alert-title ${showTitle ? 'el-is-show-flex' : 'el-is-hide'}" style="${titleStyle}" id="AlertTitle${RandomHepler.randerIdKey}">${this.options.title.html}</h5>
                <div class="alert-content ${showContent ? 'el-is-show-flex' : 'el-is-hide'}" style="${contentStyle}"  id="AlertContent${RandomHepler.randerIdKey}">${this.options.content.html}</div>
                <div class="alert-tips ${showTips ? 'el-is-show-flex' : 'el-is-hide'}" style="${tipsStyle}" id="AlertTips${RandomHepler.randerIdKey}">${this.options.tips.html}</div>
                <div class="alert-copy-ok-tips" id="AlertOkTips${RandomHepler.randerIdKey}" style="${okTipsStyle}" ></div>
                <div class="alert-bottom ${showBottom ? 'el-is-show-flex' : 'el-is-hide'}" style="${bottomStyle}" id="AlertBottom${RandomHepler.randerIdKey}">${_bottomHtml}</div>
            `;

            $body.appendChild(elAlert);

            // 初始化获取dom
            this.fnGetEles();
            // 初始化事件监听
            EventHandler.fnBindEvents(_this);

            // 是否实例化的时候就弹出（不需要再次调用open()方法）
            if (this.options.useInitShow) {
                this.open();
            }
            // 传入自定义函数
            if (this.options.onMounted && typeof this.options.onMounted === 'function') {
                this.options.onMounted();
            }
        }
    };

    window.TzAlert = TzAlert;
}());