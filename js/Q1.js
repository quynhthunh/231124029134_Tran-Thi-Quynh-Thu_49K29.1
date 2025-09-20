// js/Q1.js — Q1: Doanh số bán hàng theo Mặt hàng
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const width = 1000, height = 600, margin = {top:60, right:180, bottom:50, left:250};

const svg = d3.select("#chart-container")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`);

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

// tooltip
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

d3.csv("../data_ggsheet.csv", d3.autoType).then(data => {
  // Tạo trường Mặt hàng
  data.forEach(d => {
    d["Mặt hàng"] = `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`;
  });

  // Gom nhóm theo Mặt hàng
  const rolled = d3.rollups(
    data,
    v => ({
      doanhthuM: d3.sum(v, d => d["Thành tiền"]) / 1e6,
      doanhthu: d3.sum(v, d => d["Thành tiền"]),
      sl: d3.sum(v, d => d["Số lượng"]),
      ten: v[0]["Tên mặt hàng"],
      ma: v[0]["Mã mặt hàng"],
      nhom: v[0]["Mã nhóm hàng"]
    }),
    d => d["Mặt hàng"]
  );

  let sales = rolled.map(([Mặt_hàng, obj]) => ({Mặt_hàng, ...obj}));
  sales.sort((a,b) => d3.descending(a.doanhthuM, b.doanhthuM));

  // Scales
  const x = d3.scaleLinear()
    .domain([0, d3.max(sales, d => d.doanhthuM)]).nice()
    .range([0, innerWidth]);

  const y = d3.scaleBand()
    .domain(sales.map(d => d.Mặt_hàng))
    .range([0, innerHeight])
    .padding(0.2);

  const color = d3.scaleOrdinal()
    .domain(["BOT", "SET", "THO", "TMX", "TTC"])
    .range(["#20b2aa", "#444", "#e74c3c", "#f1c40f", "#7f8c8d"]);

  // Bars
  g.selectAll("rect")
    .data(sales)
    .join("rect")
      .attr("y", d => y(d.Mặt_hàng))
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("width", d => x(d.doanhthuM))
      .attr("fill", d => color(d.nhom))
      .on("mousemove", (event, d) => {
        tooltip.style("opacity", 1)
          .html(`
            <b>${d.ten}</b> (Mã: ${d.ma})<br/>
            Doanh thu: ${d3.format(",.0f")(d.doanhthu)} VNĐ<br/>
            Số lượng: ${d.sl}
          `)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseleave", () => tooltip.style("opacity", 0));

  // Nhãn giá trị cuối mỗi cột
  g.selectAll(".label")
    .data(sales)
    .join("text")
      .attr("class", "label")
      .attr("x", d => x(d.doanhthuM) + 5)
      .attr("y", d => y(d.Mặt_hàng) + y.bandwidth()/1.6)
      .text(d => d3.format(",.0f")(d.doanhthuM) + " triệu VND")
      .style("font-size", "11px")
      .style("fill", "#333");

  // Axes
  const xAxis = d3.axisBottom(x).ticks(6).tickFormat(d => d + "M");
  const yAxis = d3.axisLeft(y).tickSize(0);

  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(xAxis);

  g.append("g").call(yAxis).selectAll("text").style("font-size", "11px");

  // Title
  svg.append("text")
    .attr("x", width/2)
    .attr("y", margin.top/2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .style("fill", "#008080")
    .text("Doanh số bán hàng theo Mặt hàng");

  // Legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 80}, ${margin.top})`);

  const groups = color.domain();

  groups.forEach((key, i) => {
    const yPos = i * 25;
    legend.append("rect")
      .attr("x", 0)
      .attr("y", yPos)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", color(key));

    legend.append("text")
      .attr("x", 22)
      .attr("y", yPos + 12)
      .text(key === "BOT" ? "Bột"
          : key === "SET" ? "Set trà"
          : key === "THO" ? "Trà hoa"
          : key === "TMX" ? "Trà mix"
          : "Trà củ, quả sấy")
      .style("font-size", "12px")
      .attr("alignment-baseline", "middle");
  });
});
