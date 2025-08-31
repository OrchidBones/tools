$(document).ready(()=>{
    $('.submit button').click(()=>{
        const indent = '    ';
        const prefix = '<ulds>{\n';
        const suffix = '}</ulds>';
        const textArray = [];
        textArray.push(prefix);
        const filename = $('#filename').val();
        if(!filename) {
            alert('请输入图像名称！');
            return;
        }
        textArray.push(indent+'"name": '+'"'+filename+'"'+',\n');
        const positionType = +$('.coordinate-anchor-area select').val();
        const x = positionType ? '"this.rx('+($('#coordinate-x').val() || '0')+')"' : ($('#coordinate-x').val() || '0');
        const y = positionType ? '"this.ry('+($('#coordinate-y').val() || '0')+')"' : ($('#coordinate-y').val() || '0');
        textArray.push(indent+'"x": '+x+',\n');
        textArray.push(indent+'"y": '+y+',\n');
        const zIndex = $('#z-index').val() || '0';
        textArray.push(indent+'"z": '+zIndex+',\n');
        if($('#foldername').val()) {
            const foldername = '"'+$('#foldername').val()+'"';
            textArray.push(indent+'"path": '+foldername+',\n');
        }
        if(+$('.image-target-type-area select').val()) {
            textArray.push(indent+'"loop": true,\n');
        }
        if(+$('.blend-mode-area select').val()) {
            const blendMode = $('.blend-mode-area select').val();
            textArray.push(indent+'"blendMode": '+blendMode+',\n');
        }
        if($('#visibility').val()) {
            const visibility = '"'+$('#visibility').val()+'"';
            textArray.push(indent+'"visible": '+visibility+',\n');
        }
        if($('#rotation').val()) {
            const rotation = isNaN($('#rotation').val()) ? '"'+$('#rotation').val()+'"' : $('#rotation').val();
            textArray.push(indent+'"rotation": '+rotation+',\n');
        }
        if($('#opacity').val()) {
            const opacity = isNaN($('#opacity').val()) ? '"'+$('#opacity').val()+'"' : $('#opacity').val();
            textArray.push(indent+'"opacity": '+opacity+',\n');
        }
        if($('#scale-x').val()) {
            const scaleX = isNaN($('#scale-x').val()) ? '"'+$('#scale-x').val()+'"' : $('#scale-x').val();
            textArray.push(indent+'"scale.x": '+scaleX+',\n');
        }
        if($('#scale-y').val()) {
            const scaleY = isNaN($('#scale-y').val()) ? '"'+$('#scale-y').val()+'"' : $('#scale-y').val();
            textArray.push(indent+'"scale.y": '+scaleY+',\n');
        }
        if($('#anchor-x').val()) {
            const anchorX = isNaN($('#anchor-x').val()) ? '"'+$('#anchor-x').val()+'"' : $('#anchor-x').val();
            textArray.push(indent+'"anchor.x": '+anchorX+',\n');
        }
        if($('#anchor-y').val()) {
            const anchorY = isNaN($('#anchor-y').val()) ? '"'+$('#anchor-y').val()+'"' : $('#anchor-y').val();
            textArray.push(indent+'"anchor.y": '+anchorY+',\n');
        }
        if($('#blt-start-x').val() && $('#blt-start-y').val() && $('#blt-width').val() && $('#blt-height').val()) {
            const startX = $('#blt-start-x').val();
            const startY = $('#blt-start-y').val();
            const width  = $('#blt-width').val();
            const height = $('#blt-height').val();
            textArray.push(
                indent+'"frame": "{'+
                'x: '+startX+', '+
                'y: '+startY+', '+
                'w: '+width+', '+
                'h: '+height+
                '}",\n'
            );
        }
        textArray[textArray.length - 1] = textArray[textArray.length - 1].replace(',\n','\n');
        textArray.push(suffix);
        $('.result textArea').val(textArray.join(''));
    });
})