const { response } = require('express')
const express = require('express')
const { v4: uuidv4 } = require("uuid")
const app = express()

app.use(express.json())

//Middleware

function verifyIfExistsAccountCPF(req, res, next) {
    const { cpf } = req.headers
    const customer = customers.find((customer) => customer.cpf === cpf)

    if (!customer) {
        return res.status(400).json({ "error": "Customer not found" })
    }

    req.customer = customer

    return next()
}

function getBalance (statement){
    const balance = statement.reduce((acc, operation)=>{
        if(operation.type === 'credit'){
            return acc + operation.amount
        }
        else{
            return acc - operation.amount
        }
    }, 0)
    console.log(statement)
    return balance
}

const customers = []
app.post('/account', (req, res) => {
    const { cpf, name } = req.body
    const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf)
    if (customerAlreadyExists) {
        return res.status(400).json({ error: "Customer already exists!" })
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: [],
    })

    return res.status(201).json({ "cpf": customers })

})

app.get('/statement', verifyIfExistsAccountCPF, (req, res) => {
    try {
        const { customer } = req
        return res.json(customer.statement)
    } catch (error) {
        return res.json(error)
    }

})

app.post('/deposit', verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req
    const { description, amount } = req.body

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation)

    return res.status(201).json(customer)
})

app.post('/withdraw', verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req
    const {amount} = req.body
    const balance = getBalance(customer.statement)
    
    if(balance < amount){
        return res.status(400).json({error: "Insuficient founds!"})
    }

    const statementOperationWithDraw = {
        amount,
        create_at: new Date(),
        type: 'debit'
    }

    customer.statement.push(statementOperationWithDraw)
    return res.status(201).json(customer.statement)
})

app.get('/statement/date', verifyIfExistsAccountCPF, (req, res) => {
    const {customer} = req
    const {date} = req.query
    
    const dateFormat = new Date(date+" 00:00");
    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString())

    return res.json(statement)
})


app.listen(8080)