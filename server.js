const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors"); // 引入cors模块
const app = express();
const port = process.env.PORT || 3000;
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const dotEnv = require("dotenv");
dotEnv.config();

mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB");
});

// 当连接出错时的回调函数
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

// 定义产品模型
const Product = mongoose.model("Product", {
  category: String,
  id: String,
  image: String,
  is_enabled: Number,
  origin_price: String,
  price: String,
  title: String,
  unit: String,
});

const Category = mongoose.model("Category", {
  id: String,
  category_name: String,
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },
});

app.use(bodyParser.json());
const Member = mongoose.model("Member", {
  username: String,
  password: String,
});

app.use(bodyParser.json());

// JWT验证中间件
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).send("Access Denied");

  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    req.member = verified;
    next();
  } catch (err) {
    res.status(400).send("Invalid Token");
  }
};

// Swagger配置
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "香水電商測試網站",
      version: "1.0.0",
      description: "專題",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: "Development server",
      },
    ],
  },
  apis: ["./index.js"], // 指定API文件路径
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use(cors());
//NOTE - 取得產品列表
/**
 * @swagger
 * /products:
 *   get:
 *     summary:
 *     responses:
 *       200:
 *         description: 產品列表
 */
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findOne({ id: id });
    if (product) {
      res.json(product);
    } else {
      res.status(404).send("Product not found");
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post("/products", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).send("Product added");
  } catch (err) {
    res.status(500).send(err);
  }
});

app.put("/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedProduct = req.body;
    await Product.findOneAndUpdate({ id: id }, updatedProduct);
    res.send("Product updated");
  } catch (err) {
    res.status(500).send(err);
  }
});

app.delete("/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await Product.findOneAndDelete({ id: id });
    res.send("Product deleted");
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const member = new Member({ username, password });
    await member.save();
    res.status(201).send("User registered");
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const member = await Member.findOne({ username });
    if (!member) return res.status(400).send("Username not found");

    if (member.password !== password)
      return res.status(400).send("Invalid password");

    // 创建并分发 JWT 令牌
    const token = jwt.sign({ _id: member._id }, process.env.TOKEN_SECRET);
    res.header("authorization", token).send(token);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post("/categories", async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).send("Category added");
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/categories/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const category = await Category.findOne({ id: id });
    if (category) {
      res.json(category);
    } else {
      res.status(404).send("Category not found");
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

// 更新 Category
app.put("/categories/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedCategory = req.body;
    await Category.findOneAndUpdate({ id: id }, updatedCategory);
    res.send("Category updated");
  } catch (err) {
    res.status(500).send(err);
  }
});

// 删除 Category
app.delete("/categories/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await Category.findOneAndDelete({ id: id });
    res.send("Category deleted");
  } catch (err) {
    res.status(500).send(err);
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
