let aImageMapper = []; //to store all the xpos, ypos and descriptions
let posx, posy; // to keep current xpos and ypos of click

let marginLeft = 0;
let marginTop = 0;
function handleFileUpload(input) {

    let aImageProperties = [];
    if (input.files && input.files[0]) {

        let uploadedFile = input.files[0];
        let type = uploadedFile.type;
        if (type.split('/')[0] !== 'image') {
            alert('Only image file can be uploaded!');
        }

        aImageProperties.push({
            property: "Image Name: ",
            value: uploadedFile.name
        });

        aImageProperties.push({
            property: "MIME Type: ",
            value: type
        });

        var reader = new FileReader();

        reader.readAsDataURL(uploadedFile);

        reader.onload = function (e) {

            var image = new Image();
            image.src = e.target.result;

            image.onload = function () {
                var height = this.naturalHeight || this.height;
                var width = this.naturalWidth || this.width;

                aImageProperties.push({
                    property: "Dimensions: ",
                    value: `${width} x ${height}`
                });

                let table = document.getElementById("ImagePropertiesTable_Body");

                tableCleanup(table);

                aImageProperties.forEach((item) => {
                    updateTable(table, item);
                });

                //Image Mapper Table Cleanup on new image upload
                aImageMapper = [];
                tableCleanup(document.getElementById("ImageMapperTable_Body"))
                document.getElementById("ImageMapperTable").style.display = "none";

                var svg = d3.select('svg');

                svg.selectAll("*").remove();

                svg.append('image')
                    .attr('xlink:href', e.target.result)
                    .attr('width', "100%")
                    .attr('height', "100%")

                svg.on('click', d => {

                    marginLeft = document.getElementById('svgContainer').getBoundingClientRect().left;
                    marginTop = document.getElementById('svgContainer').getBoundingClientRect().top;
                    posx = d3.event.x - marginLeft;
                    posy = d3.event.y - marginTop;

                    openForm();
                });
                return true;
            };
        };


    }
}

//To open popup to enter description on click at any point on image
function openForm() {
    document.getElementById("mapperForm").style.display = "block";
    document.getElementById("mapperForm").style.left = (posx + marginLeft) + "px";
    document.getElementById("mapperForm").style.top = posy + "px";
}

//To close popup 
function closeForm() {
    document.getElementById("mapperForm").style.display = "none";
}

//On Pressing save button on popup
function submitForm(event) {
    event.preventDefault();

    //getting description entered by user
    var mapDesc = document.forms["descForm"]["description"].value;

    closeForm();

    let data = {
        x: posx,
        y: posy,
        desc: mapDesc
    };
    aImageMapper.push(data);

    document.getElementById("ImageMapperTable").style.display = "block";

    const table = document.getElementById("ImageMapperTable_Body");

    updateTable(table, data);

    drawCircle();
}

function updateTable(table, data) {
    let row = table.insertRow();

    let keys = Object.keys(data);
    for (let index in keys) {
        let cell = row.insertCell(index);
        cell.innerHTML = data[keys[index]];
    }
}

function tableCleanup(table) {
    for (var i = table.rows.length; i > 0; i--) {
        table.deleteRow(i - 1);
    }
}


function drawCircle() {

    let svg = d3.select('svg');

    var tooltip = d3.select(".tooltip");

    svg
        .selectAll("circle")
        .data(aImageMapper)
        .enter()
        .append("circle")
        .attr("class", (d, i) => { return "grp" + i; })
        .attr("cx", (d, i) => { return d.x; })
        .attr("cy", (d, i) => { return d.y; })
        .attr("r", "5")
        .on("mouseover", (d) => {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(d.desc)
                .style("left", (d3.event.x - marginLeft) + "px")
                .style("top", (d3.event.y - marginTop) + "px");
        })
        .on("mouseout", (d) => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
}


