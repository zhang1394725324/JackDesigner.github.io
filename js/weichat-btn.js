(function () {
        const btns = `
                <button class="btn" id="CloseAlert">确定</button>
            `;
        const tzAlert = new TzAlert({
            center: true, // 内容居中
            isShow: false,  // 实例化完成直接显示
            title: {
                html: 'Jackzhang的微信二维码',
                color: '#ff80ab',
                fontSize: '18px'
            },
            maskClose: true,
            mask: {
                use: true,
                background: 'rgba(0,0,0,.6)'
            },
            tips: {
                html: '提示：请使用微信扫码哦！'
            },
            content: {
                html:  `
                            <div class="demo" >
                              <img src="images/erweima/weichat.png"  alt="Work 2">
                                <h5>Jackzhang微信号：15036669082</h5>
                            </div>`
            },
            onEvents(e) {
                console.log('监听了内部的按钮事件')
                console.log(e)
            },
            onMounted: function () {
                console.log('执行我吧')
            }
        });
        // tzAlert.open(); // 初始化显示(方式2)

        // 事件调用显示
        document.getElementById('showAlert').onclick = function () {
            tzAlert.open({
                center: false,
                title: {
                    html: 'Jackzhang的微信二维码'
                },
                tips: {
                    html: '提示：请使用微信扫码哦！'
                },
                maskClose: false,
                mask: {
                    use: true,
                    background: 'rgba(0,0,0,.6)'
                },
                cancel: {
                    use: false,
                },
                content: {
                    html: `
                            <div class="demo" >
                              <img src="images/erweima/weichat.png"  alt="Work 2">
                                <h5>Jackzhang微信号：15036669082</h5>
                            </div>`
                },
                onClose() {
                    console.log('监听了关闭');
                },
                onMounted: function () {
                    console.log('执行我了')
                }
            });
        }

        // 事件调用显示
        document.getElementById('showAlert2').onclick = function () {
            tzAlert.open({
                center: false,
                title: {
                    html: 'Jackzhang的微信二维码'
                },
                tips: {
                    html: '提示：请使用微信扫码哦！'
                },
                maskClose: false,
                mask: {
                    use: false,
                    background: 'rgba(0,0,0,.6)'
                },
                copy: {
                    onlyText: false,
                    isDbClick: false
                },
                cancel: {
                    use: false,
                },
                content: {
                    html: `
                            <div class="demo" >
                              <img src="images/erweima/weichat.png"  alt="Work 2">
                                <h5>Jackzhang微信号：15036669082</h5>
                            </div>`
                },
                onMounted: function () {
                    console.log('弹出完毕！')
                }
            });
        }
        
    }());  