const express = require('express');
const bodyParser = require("body-parser");
const TronWeb = require('tronweb');

const datos = require('./datos_prueba.json');
const delay = ms => new Promise(res => setTimeout(res, ms));

//console.log(datos);

const app = express();
const port = process.env.PORT;
const prykey = process.env.APP_PRYKEY;
const red = process.env.APP_RED;
const SC = process.env.APP_CONTRACT || "TYULMzkrw9mfGVVPJdxbP9K7og3Na5ajPv";


const TRONGRID_API = "https://api."+red+"trongrid.io";

console.log("Network: "+TRONGRID_API);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


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
		let numero = req.body.numero;

    let contract = await tronWeb.contract().at(SC);//direccion del contrato

    let varconsu = await contract.verConsumo(cuenta, numero).call();

		varconsu[0] = parseInt(varconsu[0]._hex);
		varconsu[1] = parseInt(varconsu[1]._hex);
		varconsu[2] = parseInt(varconsu[2]._hex);
		let tempoh = new Date(varconsu[2]*1000)

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
				"hora_humana": tempoh.toLocaleString({timeZone: 'GMT-5'})
			}
		}
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
		var response = {
			"IsOk": "1",
	    "Message": "",
	    "Data": {
				"ClienteId": cuenta,
				"CantidadKWH": lectura,
				"RegistroBC": "https://"+red+"tronscan.org/#/transaction/"+regconsu
			}
		}
    //console.log("https://shasta.tronscan.org/#/transaction/"+regconsu);
    res.send(response);
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
