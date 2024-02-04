require('dotenv').config()

const TelegramBot = require('node-telegram-bot-api')
const axios = require('axios')
const plot = require('function-plot')
const fs = require('node:fs')
const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN 
const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true })
const storage = {}
const text =  require('./const')

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id
    bot.sendMessage(
      chatId,
      'Привет я максимка бот',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Погода', callback_data: 'get_weather' }],
            [{ text: 'Графики', callback_data: 'get_graf' }],
          ],
        },
      }
    )
  })

bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id
    const data = callbackQuery.data
  
    switch (data) {
      case 'get_weather':
        const userDataWeather = getUserData(chatId)
        userDataWeather.WaitingForWeather = true
        bot.sendMessage(chatId, 'Напишите город в котором вы хотите узнать погоду')
        break
      case 'get_graf':
        const userDataGraf = getUserData(chatId)
        userDataGraf.WaitingForGraf = true
        bot.sendMessage(chatId, 'Напишите ункцию график которой вам надо построить')
      default:
        break
    }
})
 
function getUserData(chatId) {
let userData = storage[chatId]
if (!userData) {
    userData = {
    WaitingForWeather: false,
    WaitingForGraf: false,
    }
    storage[chatId] = userData
}
return userData
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id
    const text = msg.text
  
    const userData = getUserData(chatId)
    if (userData.WaitingForWeather) {
      const city = text
      let messageText = ''
      messageText = await getWeatherData(city)
      bot.sendMessage(chatId, messageText)
      resetUserData(chatId)
    if (userData.WaitingForGraf){
      const graf = text 
      let massageIMG = ''
      massageIMG = await getGraf(graf)
      bot.sendPhoto(chatId, massageIMG)
      resetUserData(chatId)
    }
}})


async function getWeatherData(city) {
  // axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHERMAP_API_KEY}`)
  // .catch(function (error) {
  //   if (error.response) {
  //     const errorWeather = error.response.status
  //     console.log(errorWeather)
  //     catchWeathererror(errorWeather)
  //   }
  //   })
  //   function catchWeathererror(errorWeather){
  //       if (errorWeather !=  ){

  //       }
  //   }
  // тут надо дописать ловлю ошибки чтоб при написании непонтного города бота тупо не крашило и он дальше жил классной жизнью
    const response = await axios.get(
        `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHERMAP_API_KEY}`
    )
    const temperature = Math.round(response.data.main.temp - 273.15)
    const messageText = `Температура в городе ${city} сейчас состовляет ${temperature}°C.`
    return messageText
}

// async function getGraf(garf){
//   functionPlot({
//     target: svg,  
//     data: [{
//       fn: garf,
//       derivative: {
//         fn: graf,
//         updateOnMouseMove: true
//       }
//     }]
//   })
// }

// тут надо дописать саму переделку в фото и тогда все будет круто классно

bot.onText(/\/help/,(msg) => {bot.sendMessage(msg.chat.id, text.commands)})



function resetUserData(chatId) {
    const userData = getUserData(chatId)
    userData.WaitingForWeather = false
    userData.WaitingForGraf = false
}