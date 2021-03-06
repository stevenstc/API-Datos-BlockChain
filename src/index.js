const express = require('express');
const bodyParser = require("body-parser");
const TronWeb = require('tronweb');
const moment = require('moment-timezone');

const datos = require('./datos_prueba.json');
const delay = ms => new Promise(res => setTimeout(res, ms));

//console.log(datos);

const app = express();
const port = process.env.PORT;
const prykey = process.env.APP_PRYKEY;
const red = process.env.APP_RED;
const SC = process.env.APP_CONTRACT || "THuaZzMzW9Cm5jFyq295QnhH8zFNDSC4zz";


const TRONGRID_API = "https://api."+red+"trongrid.io";

console.log("Network: "+TRONGRID_API);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
/*
//Configure Header HTTP
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header(
		"Access-Control-Allow-Headers",
		"Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method"
	);
	res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
	res.header("Allow", "GET, POST, OPTIONS, PUT, DELETE");
	next();
});
*/

tronWeb = new TronWeb(
	TRONGRID_API,
	TRONGRID_API,
	TRONGRID_API,
	prykey
);

app.get('/api/',async(req,res) => {

    res.send("Conectado y funcionando v1.0");
});

app.get('/api/ver/consumo/:cuenta',async(req,res) => {

    let cuenta = req.params.cuenta;
		cuenta = parseInt(cuenta);
		let numero = req.body.numero;
		numero = parseInt(numero);

		if (numero <= 0) {
			var response = {
				"IsOk": "0",
		    "Message": "Las lecturas comienzan desde el número 1",
		    "Data": {}
			}
	    res.send(response);

		}

    let contract = await tronWeb.contract().at(SC);//direccion del contrato

	let datosLecturas = await contract.verlecturas(cuenta).call();
	datosLecturas = datosLecturas[0];
	datosLecturas = datosLecturas[numero];

	  let varconsu = await contract.verConsumo(cuenta, numero).call()
  	.catch(error =>{
			var response = {
				"IsOk": "0",
		    "Message": error,
		    "Data": {}
			}
	    res.send(response);

		});

		varconsu[0] = parseInt(varconsu[0]._hex);
		varconsu[1] = parseInt(varconsu[1]._hex);
		varconsu[2] = parseInt(varconsu[2]._hex);
		let tempoh = new Date(varconsu[2]*1000);
		tempoh = moment(tempoh);
		console.log(tempoh);
		console.log(tempoh.toLocaleString('es-CO'));
		console.log(varconsu);

		var response = {
			"IsOk": "1",
	    "Message": "",
	    "Data": {
				"ClienteId": cuenta,
				"cantidad_de_lecturas": varconsu[0],
				"lectura-numero": numero,
				"KW_registrados": varconsu[1],
				"Tiempo_de_registro": varconsu[2]*1000,
				"hora_humana": tempoh.tz('America/Bogota').format('MMMM Do YYYY, h:mm:ss a'),
				"RegistroBC": "https://"+red+"tronscan.org/#/transaction/"+varconsu[3]
			}
		}

	
				//"RegistroBC": "https://"+red+"tronscan.org/#/transaction/"+datosLecturas[0]
    //console.log("https://shasta.tronscan.org/#/transaction/"+regconsu);
    res.send(response);
});


app.post('/api/registar/consumo',async(req,res) => {

    let cuenta = req.body.cuenta;
		let lectura = req.body.lectura;

    let contract = await tronWeb.contract().at(SC);//direccion del contrato

    let regconsu = await contract.registarConsumo(parseInt(cuenta), parseInt(lectura)).send();
    await contract.registrarHashOriginal(regconsu, parseInt(cuenta)).send();

    let direccion = await tronWeb.trx.getAccount();
    direccion = direccion.address;
    direccion = tronWeb.address.fromHex(direccion);

	await delay(3000);

	await tronWeb.trx.getTransaction(regconsu)
    .then(value=>{
      console.log(value);

      if (value.ret[0].contractRet === 'SUCCESS') {

		var response = {
			"IsOk": "1",
	    "Message": "",
	    "Data": {
				"ClienteId": cuenta,
				"CantidadKWH": lectura,
				"RegistroBC": "https://"+red+"tronscan.org/#/transaction/"+regconsu
			}
		}

        res.send(response);
      }else {
		response = {
			"IsOk": "0",
		"Message": "No se pudo completar el registro ",
		"Data": {}
		}

        res.send(response);
      }
    })
    .catch(value=>{
      console.log(value);
			response = {
				"IsOk": "0",
				"Message": value,
				"Data": {
					"ClienteId": cuenta,
					"errorRegistroBC": "https://"+red+"tronscan.org/#/transaction/"+regconsu
				}
			}
      res.send(response);
	
	})

});

app.post('/api/registar/cuenta',async(req,res) => {

    let cuenta = req.body.cuenta;

		let direccion = await tronWeb.trx.getAccount();
    direccion = direccion.address;
    direccion = tronWeb.address.fromHex(direccion);

    let contract = await tronWeb.contract().at(SC);//direccion del contrato

    let regconsu = await contract.registarCuenta(cuenta).send();

	var response = {};

	await delay(3000);

	await tronWeb.trx.getTransaction(regconsu)
    .then(value=>{
      console.log(value);

      if (value.ret[0].contractRet === 'SUCCESS') {

				response = {
					"IsOk": "1",
			    "Message": "registro cuenta: "+cuenta+" | desde: "+direccion,
			    "Data": {
						"ClienteId": cuenta,
						"RegistroBC": "https://"+red+"tronscan.org/#/transaction/"+regconsu
					}
				}

        res.send(response);
      }else {
				response = {
					"IsOk": "0",
			    "Message": "No se pudo completar el registro | la cuenta ya está registrada",
			    "Data": {}
				}

        res.send(response);
      }
    })
    .catch(value=>{
      console.log(value);
			response = {
				"IsOk": "0",
				"Message": value,
				"Data": {
					"ClienteId": cuenta,
					"errorRegistroBC": "https://"+red+"tronscan.org/#/transaction/"+regconsu
				}
			}
      res.send(response);
    })

});

app.post('/api/admin/nuevo',async(req,res) => {

    let direccion2 = req.body.direccion;
    let nombre = req.body.nombre;

    let contract = await tronWeb.contract().at(SC);//direccion del contrato

    let regconsu = await contract.registarAdmin(direccion2, nombre).send();

    let direccion = await tronWeb.trx.getAccount();
    direccion = direccion.address;
    direccion = tronWeb.address.fromHex(direccion);
    console.log("https://shasta.tronscan.org/#/transaction/"+regconsu)
    res.send("[OK] = " + "se registro la medida: "+medida+" en la cuenta: "+cuenta+" | desde: "+direccion);
});

app.post('/api/admin/eliminar',async(req,res) => {

    let direccion2 = req.body.direccion;

    let contract = await tronWeb.contract().at(SC);//direccion del contrato

    let regconsu = await contract.quitarAdmin(direccion2).send();

    let direccion = await tronWeb.trx.getAccount();
    direccion = direccion.address;
    direccion = tronWeb.address.fromHex(direccion);
    console.log("https://shasta.tronscan.org/#/transaction/"+regconsu)
    res.send("[OK] = " + "se registro la medida: "+medida+" en la cuenta: "+cuenta+" | desde: "+direccion);
});

app.listen(port, ()=> console.log('Escuchando Puerto: ' + port))
