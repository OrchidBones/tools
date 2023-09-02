$(document).ready(()=>{
    $.getJSON('data.json', (data)=>{
        $('button').click(()=>{
            var obj = document.getElementById('type');
            var si = obj.selectedIndex;
            var type = obj.options[si].value;
            var input = document.getElementById("ori-i").value;
            var table = data[type];
            var arr = input.split('');
            var tar_arr = [];
            arr.forEach((item)=>{
                var index = table['ori'].indexOf(item);
                var char = item;
                if(index != -1) {
                    char = table['tar'].split(',')[index];
                }
                tar_arr.push(char);
            });
            var res = tar_arr.join('');
            $('#res-i').text(res);
        })
    })
})