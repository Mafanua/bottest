require('dotenv').config()

const Fs = require('fs')
const TelegramBot = require('node-telegram-bot-api')
const axios = require('axios')
const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN 
const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true })
const storage = {}
const text = require('./const')

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id
    bot.sendMessage(
      chatId,
      'Привет я максимка бот',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Погода', callback_data: 'get_weather', show_loading: false }],
            [{ text: 'Графики', callback_data: 'get_graf', show_loading: false }],
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
      bot.sendMessage(chatId, text.grafanotation)
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
      messageText = await getWeather(city)
      bot.sendMessage(chatId, messageText)
      resetUserData(chatId)
    }else if (userData.WaitingForGraf){
      const chart = text
      try{
        const data = []
        for (let x = -10; x <= 10; x++) {
          const y = eval(chart)
          data.push(y)
        }
        data.join(',')
        let massageIMG = ''
        massageIMG = await gatChart(data)
        bot.sendPhoto(chatId, massageIMG, { 
          caption: 'График функции ' + chart,
          contentType: 'image' 
        })
        resetUserData(chatId)
      }catch(e){
        bot.sendMessage(chatId, 'Вы вели неправилный график попробуйте еще раз')
      }
    }
})


async function getWeather(city) {
    try{
      const response = await axios.get(
        `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHERMAP_API_KEY}`
      )
      const temperature = Math.round(response.data.main.temp - 273.15)
      const messageText = `Температура в городе ${city} сейчас состовляет ${temperature}°C.`
      return messageText
    }catch(e){
      const messageText = 'Вы неправильно ввели город попробуйте еще раз'
      return messageText
    }
}

async function gatChart(chart) {
  try {
    const response = await axios.get(
      `https://chart.googleapis.com/chart?cht=lc&chs=400x300&chd=t:${chart}`, 
      { responseType: 'stream' }
    )
    const massageIMG = response.data
    return massageIMG 

  } catch (e) {
    console.log('что-то не рабоатет');
  }
}



// тут надо дописать саму переделку в фото и тогда все будет круто классно

bot.onText(/\/help/,(msg) => {bot.sendMessage(msg.chat.id, text.commands)})



function resetUserData(chatId) {
    const userData = getUserData(chatId)
    userData.WaitingForWeather = false
    userData.WaitingForGraf = false
}