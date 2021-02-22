async function submitForm(event) {
    event.preventDefault();
    let ticker = document.forms["tickerForm"]["ticker"].value;

    let stockApi = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&outputsize=full&apikey=6N9RKBK6HUSH6D1X`;

    try {
        let data = await d3.json(stockApi);

        if (data["Error Message"]) {
            alert(data["Error Message"]);
            return;
        }
        let oTimeSeriesData = data["Time Series (Daily)"];
        let aTimeSeriesData = Object.keys(oTimeSeriesData).map(time => {
            let oTimeData = data["Time Series (Daily)"][time];
            return {
                date: parseDate(time),
                open: Number(oTimeData["1. open"]),
                high: Number(oTimeData["2. high"]),
                low: Number(oTimeData["3. low"]),
                close: Number(oTimeData["4. close"])
            };
        });

        generateChart(aTimeSeriesData);


    } catch (oError) {
        alert(oError);
    }
}

let parseDate = d3.timeParse("%Y-%m-%d");

const generateChart = data => {

    //one year previous date
    let lowerLimitDate = new Date();
    lowerLimitDate.setFullYear(lowerLimitDate.getFullYear() - 1)

    // filtering out data based on lower limit of date
    data = data.filter(row => {
        if (row.date) {
            return row.date >= lowerLimitDate;
        }
    });

    //sorting data in ascending order of date
    data.sort((a, b) => a.date - b.date);

    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

    const height = document.getElementById('chart').getBoundingClientRect().height - margin.top - margin.bottom;
    const width = document.getElementById('chart').getBoundingClientRect().width - margin.left - margin.right;

    const minY = d3.min(data, d => {
        return d.close;
    });

    const maxY = d3.max(data, d => {
        return d.close;
    });

    const minX = d3.min(data, d => {
        return d.date;
    });

    const maxX = d3.max(data, d => {
        return d.date;
    });

    const x = d3
        .scaleTime()
        .domain([minX, maxX])
        .range([0, width]);

    const y = d3
        .scaleLinear()
        .domain([minY, maxY])
        .range([height, 0]);

    let yAxis = d3.axisLeft(y);
    let xAxis = d3.axisBottom(x);

    let chartDiv = d3
        .select('#chart');

    chartDiv.selectAll("*").remove();
    const svg = chartDiv
        .append('svg')
        .attr('width', width + margin['left'] + margin['right'])
        .attr('height', height + margin['top'] + margin['bottom'])
        .append('g')
        .attr('transform', `translate(${margin['left']}, ${margin['top']})`);

    svg.append('g').attr("class", "axis y").call(yAxis);

    svg.append('g').attr("class", "axis x").attr("transform", `translate(0,${height})`).call(xAxis);

    const line = d3
        .line()
        .x(d => {
            return x(d.date);
        })
        .y(d => {
            return y(d.close);
        });


    svg
        .append('path')
        .data([data])
        .attr('id', 'lineChart')
        .attr('d', line);

    const marker = svg
        .append('g')
        .attr('class', 'marker')
        .style('display', 'none');

    marker.append('circle').attr('r', 4);
    marker.append('line').classed('x', true);
    marker.append('line').classed('y', true);

    svg
        .append('rect')
        .attr('class', 'overlay')
        .attr('width', width)
        .attr('height', height)
        .on('mouseover', () => marker.style('display', null))
        .on('mouseout', () => marker.style('display', 'none'))
        .on('mousemove', generateCrosshair);

    d3.select('.overlay').style('fill', 'none');
    d3.select('.overlay').style('pointer-events', 'all');

    d3.selectAll('.marker line').style('fill', 'none');
    d3.selectAll('.marker line').style('stroke', '#1F2605');
    d3.selectAll('.marker line').style('stroke-width', '1.5px');
    d3.selectAll('.marker line').style('stroke-dasharray', '3 3');

    //returs insertion point
    const bisectDate = d3.bisector(d => d.date).left;

    /* mouseover function to generate crosshair */
    function generateCrosshair() {
        //returns corresponding value from the domain
        const correspondingDate = x.invert(d3.mouse(this)[0]);
        //gets insertion point
        const i = bisectDate(data, correspondingDate, 1);
        const d0 = data[i - 1];
        const d1 = data[i];
        const currentPoint =
            correspondingDate - d0['date'] > d1['date'] - correspondingDate ? d1 : d0;
        marker.attr(
            'transform',
            `translate(${x(currentPoint['date'])}, ${y(
                currentPoint['close']
            )})`
        );

        marker
            .select('line.x')
            .attr('x1', -(width - (width - x(currentPoint['date']))))
            .attr('x2', width - x(currentPoint['date']))
            .attr('y1', 0)
            .attr('y2', 0);

        marker
            .select('line.y')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', -(height - (height - y(currentPoint['close']))))
            .attr('y2', height - y(currentPoint['close']));

        // updates the legend to display the date, open, close, high, low of the selected mouseover area
        updateLegends(currentPoint);
    }

    /* Legends */
    const updateLegends = currentData => {
        d3.selectAll('.lineLegend').remove();

        const legendKeys = Object.keys(data[0]);
        const lineLegend = svg
            .selectAll('.lineLegend')
            .data(legendKeys)
            .enter()
            .append('g')
            .attr('class', 'lineLegend')
            .attr('transform', (d, i) => {
                return `translate(0, ${i * 20})`;
            });
        lineLegend
            .append('text')
            .text(d => {
                if (d === 'date') {
                    return `${d.charAt(0).toUpperCase() + d.slice(1)}: ${currentData[d].toLocaleDateString()}`;
                } else {
                    return `${d.charAt(0).toUpperCase() + d.slice(1)}: ${currentData[d].toFixed(2)}`;
                }
            })
            .style('fill', '#1f2605')
            .attr('transform', `translate(${width - 100},9)`);
    };
};
