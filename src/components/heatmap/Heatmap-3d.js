import * as d3 from 'd3';

class HeatmapD3 {
    constructor(svgElement, onSelect) {
        this.svgElement = svgElement;
        this.onSelect = onSelect;
        this.margin = { top: 40, right: 50, bottom: 70, left: 100 };
        this.width = svgElement.clientWidth - this.margin.left - this.margin.right;
        this.height = svgElement.clientHeight - this.margin.top - this.margin.bottom;
        this.parseDate = d3.timeParse("%d/%m/%Y");

        this.svg = d3.select(svgElement)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        this.xAxisGroup = this.svg.append("g")
            .attr("class", "xAxisG")
            .attr("transform", `translate(0,${this.height})`);
        this.xAxisGroup.append("text")
            .attr("class", "xAxisLabel")
            .attr("x", this.width / 2)
            .attr("y", this.margin.bottom - 10) 
            .attr("fill", "black")
            .style("text-anchor", "middle");

        this.legendGroup = this.svg.append("g")
            .attr("class", "legend-group")
            .attr("transform", `translate(${this.width + this.margin.right - 300},${this.height + 30})`);
            
        this.yAxisGroup = this.svg.append("g")
            .attr("class", "yAxisG");
        this.yAxisGroup.append("text")
            .attr("class", "yAxisLabel")
            .attr("transform", "rotate(-90)")
            .attr("x", -this.height / 2)
            .attr("y", -this.margin.left + 20) 
            .attr("fill", "black")
            .style("text-anchor", "middle"); 
    }

    render(visData, selectedItems, xDomainType = 'Hours', yDomainType = 'Days') {
        this.updateAxis(visData, xDomainType, yDomainType);
        const xValues = this.xScale.domain();
        const yValues = this.yScale.domain();

        const allCombinations = this.getAllCombinations(xValues, yValues);
        const groupedData = this.getGroupedData(selectedItems, xDomainType, yDomainType);
        const colorScale = this.getColorScale(groupedData);

        this.drawHeatmapCells(allCombinations, groupedData, colorScale);
        this.drawLegend(colorScale, groupedData);
        this.addBrush(selectedItems, xDomainType, yDomainType);
    }

    addBrush(data, xDomainType, yDomainType) {
        this.svg.selectAll(".brush").remove();
    
        const groupedData = this.getGroupedData(data, xDomainType, yDomainType);
        const colorScale = this.getColorScale(groupedData);
        const brush = d3.brush()
            .extent([[0, 0], [this.width, this.height]])
            .on("start", () => {
                // Clear the brush in the scatterplot
                d3.select(".brush").call(d3.brush().move, null);
            })
            .on("brush end", event => {
                if (event.selection) {
                    const [[x0, y0], [x1, y1]] = event.selection;
    
                    // Determine selected x and y ranges based on the scales
                    const selectedXValues = this.xScale.domain().filter(xValue => {
                        const xPos = this.xScale(xValue);
                        return xPos + this.xScale.bandwidth() > x0 && xPos < x1;
                    });
    
                    const selectedYValues = this.yScale.domain().filter(yValue => {
                        const yPos = this.yScale(yValue);
                        return yPos + this.yScale.bandwidth() > y0 && yPos < y1;
                    });
    
                    // Combine selected values for x and y to create the appropriate structure
                    const selectedData = selectedXValues.flatMap(xValue => 
                        selectedYValues.map(yValue => ({
                            [xDomainType]: xValue,
                            [yDomainType]: yValue
                        }))
                    );
                    //console.log("Selected x values:", selectedXValues);
                    //console.log("Selected y values:", selectedYValues);
                    //console.log("Selected data with brush:", selectedData);
                    if (this.onSelect) {
                        this.onSelect(selectedData);
                    }
                    // Highlight brushed cells
                    this.svg.selectAll(".cell")
                        .attr("fill", d => {
                            const group = groupedData.get(d.xDomainValue);
                            const total = group ? group.get(d.yDomainValue) || 0 : 0;
                            if (selectedXValues.includes(d.xDomainValue) && selectedYValues.includes(d.yDomainValue)) {
                                // Highlight selected cells with a brighter color
                                const defaultColor = colorScale(total);
                                return d3.rgb(defaultColor).brighter(0.5); 
                            }
                            return colorScale(total);
                        });
                }
            });
    
        this.svg.append("g")
            .attr("class", "brush")
            .call(brush)
            .style("pointer-events", "all");
    }
    
    updateAxis(visData, xDomainType, yDomainType) {
        const xDomain = this.getDomain(visData, xDomainType);
        const yDomain = this.getDomain(visData, yDomainType);
    
        this.xScale = d3.scaleBand()
            .domain(xDomain)
            .range([0, this.width])
            .padding(0.0);
    
        this.yScale = d3.scaleBand()
            .domain(yDomain)
            .range([this.height, 0])
            .padding(0.0);
    
        this.xAxisGroup.transition().duration(500).call(d3.axisBottom(this.xScale)
            .tickFormat(d => this.getTickFormat(d, xDomainType))
        );
        this.yAxisGroup.transition().duration(500).call(d3.axisLeft(this.yScale)
            .tickFormat(d => this.getTickFormat(d, yDomainType))
        );
    
        this.xAxisGroup.select(".xAxisLabel").text(xDomainType);
        this.yAxisGroup.select(".yAxisLabel").text(yDomainType);
    }
    
    getDomain(data, domainType) {
        if (domainType === 'Hours') return d3.range(0, 24);
        if (domainType === 'Days') return d3.range(0, 7);
        if (domainType === 'Months') return d3.range(1, 13);
        if (domainType === 'Seasons') return [...new Set(data.map(d => d.Seasons).filter(Boolean))];
        if (domainType === 'Holiday') return [...new Set(data.map(d => d.Holiday).filter(Boolean))];
        return [];
    }
    
    getTickFormat(value, domainType) {
        if (domainType === 'Days') return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][value];
        if (domainType === 'Months') return d3.timeFormat("%B")(new Date(2023, value - 1, 1));
        return value;
    }
    
    getGroupedData(data, xDomainType, yDomainType) {
        return d3.rollup(
            data.filter(d => this.parseDate(d.Date)),
            v => d3.sum(v, d => d.RentedBikeCount),
            d => this.getValueByType(d, xDomainType),
            d => this.getValueByType(d, yDomainType)
        );
    }
    
    getValueByType(d, domainType) {
        if (domainType === 'Hours') return d.Hour;
        if (domainType === 'Days') return (this.parseDate(d.Date).getDay() + 6) % 7;
        if (domainType === 'Months') return this.parseDate(d.Date).getMonth() + 1;
        if (domainType === 'Seasons') return d.Seasons;
        if (domainType === 'Holiday') return d.Holiday;
        return null;
    }

    getAllCombinations(hours, days) {
        const allCombinations = [];
        hours.forEach(hour => {
            days.forEach(value => {
                allCombinations.push({ xDomainValue: hour, yDomainValue: value });
            });
        });
        return allCombinations;
    }
    
    getSeasons(data) {
        return [...new Set(data.map(d => d.Seasons).filter(s => s))]; // Filter out invalid values
    }

    getHoliday(data) {
        return [...new Set(data.filter(d => d.Holiday).map(d => d.Holiday))];
    }
    
    getColorScale(groupedData) {
        return d3.scaleSequential(d3.interpolateYlGnBu)
            .domain([0, d3.max(Array.from(groupedData.values(), d => d3.max(d.values()))) || 1]);
    }

    drawHeatmapCells(allCombinations, groupedData, colorScale) {
        const cells = this.svg.selectAll(".cell")
            .data(allCombinations);
    
        cells.transition().duration(500)
            .attr("x", (d) => this.xScale(d.xDomainValue))
            .attr("y", (d) => this.yScale(d.yDomainValue))
            .attr("width", this.xScale.bandwidth())
            .attr("height", this.yScale.bandwidth())
            .attr("fill", (d) => {
                const hourGroup = groupedData.get(d.xDomainValue);
                const total = hourGroup ? hourGroup.get(d.yDomainValue) || 0 : 0;
                return colorScale(total);
            })
            .attr("stroke", (d) => {
                const hourGroup = groupedData.get(d.xDomainValue);
                const total = hourGroup ? hourGroup.get(d.yDomainValue) || 0 : 0;
                return total > 0 ? "#ccc" : "#ccc"; // Highlight with orange if data exists, else light gray
            })
            .attr("stroke-width", (d) => {
                const hourGroup = groupedData.get(d.xDomainValue);
                const total = hourGroup ? hourGroup.get(d.yDomainValue) || 0 : 0;
                return total > 0 ? 3.0 : 0.5; // Thicker border for cells with data
            });
    
        cells.exit().remove();
    
        cells.enter()
            .append("rect")
            .attr("class", "cell")
            .attr("x", (d) => this.xScale(d.xDomainValue))
            .attr("y", (d) => this.yScale(d.yDomainValue))
            .attr("width", this.xScale.bandwidth())
            .attr("height", this.yScale.bandwidth())
            .attr("fill", (d) => {
                const hourGroup = groupedData.get(d.xDomainValue);
                const total = hourGroup ? hourGroup.get(d.yDomainValue) || 0 : 0;
                return colorScale(total);
            })
            .attr("stroke", (d) => {
                const hourGroup = groupedData.get(d.xDomainValue);
                const total = hourGroup ? hourGroup.get(d.yDomainValue) || 0 : 0;
                return total > 0 ? "#ccc" : "#ccc"; // Highlight with orange if data exists, else light gray
            })
            .attr("stroke-width", (d) => {
                const hourGroup = groupedData.get(d.xDomainValue);
                const total = hourGroup ? hourGroup.get(d.yDomainValue) || 0 : 0;
                return total > 0 ? 3.0 : 0.5;; // Thicker border for cells with data
            });
    }
    
    drawLegend(colorScale, groupedData) {
        const legendWidth = 250;
        const legendHeight = 20;
     
        // Create a scale for the color legend
        const legendScale = d3.scaleLinear()
            .domain([0, d3.max(Array.from(groupedData.values(), d => d3.max(d.values()))) || 1])  // Same domain as color scale
            .range([0, legendWidth]);
    
        this.legendGroup.selectAll("*").remove();
    
        // Add a horizontal gradient to represent the color scale
        this.legendGroup.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)");
    
        // Create a linear gradient for the color scale
        const gradient = this.svg.append("defs")
            .append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%")
            .attr("x2", "100%")
            .attr("y1", "0%")
            .attr("y2", "0%");
    
        gradient.selectAll("stop")
            .data(colorScale.range())
            .enter().append("stop")
            .attr("offset", (d, i) => `${(i / (colorScale.range().length - 1)) * 100}%`)
            .attr("stop-color", d => d);
    
        const legendAxis = d3.axisBottom(legendScale)
            .ticks(5)
            .tickSize(10);
    
        this.legendGroup.append("g")
            .attr("transform", `translate(0, ${legendHeight})`)
            .call(legendAxis);
    } 
}

export default HeatmapD3;
