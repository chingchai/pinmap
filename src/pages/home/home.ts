import {Component} from '@angular/core';
import {NavController, NavParams, ModalController, Modal, AlertController, LoadingController} from 'ionic-angular';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';

import {HttpClient} from '@angular/common/http';
import {Geolocation} from '@ionic-native/geolocation';
import L from 'leaflet';
import 'leaflet.gridlayer.googlemutant';

import { ReportPage } from '../report/report';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  public map : L.map;  
  public marker: L.marker; 
  public pos: number[];
  public lat: number;
  public lon: number;

  public reportForm : FormGroup;
  public fplace : FormControl;
  public fdesc : FormControl;
  public fname : FormControl;
  public imageName:any;
  public imageFile:any;

  constructor(
    public navCtrl: NavController,    
    private geolocation: Geolocation,
    public loadingCtrl: LoadingController,
    private modalCtrl: ModalController,
    private transfer: FileTransfer,
    public fb : FormBuilder,  
    private camera : Camera, 
    public navParams: NavParams, 
    private alertCtrl: AlertController,
    public http: HttpClient
  ) {
    this.fplace = fb.control('', Validators.required);
    this.fname = fb.control('', Validators.required);
    this.fdesc = fb.control('');
    this.reportForm = fb.group({ 
      'fplace': this.fplace,
      'fname': this.fname,
      'fdesc': this.fdesc, 
    })
  }

  ionViewDidLoad(){
    this.loadMap();  
  }

  loadMap(){    
    this.map = L.map('map',{
      center: [13.00, 101.50],
      zoom: 5
    })

    var roads = L.gridLayer.googleMutant({
      type: 'roadmap' // valid values are 'roadmap', 'satellite', 'terrain' and 'hybrid'
    });

    var satellite = L.gridLayer.googleMutant({
      type: 'satellite' // valid values are 'roadmap', 'satellite', 'terrain' and 'hybrid'
    });

    var hybrid = L.gridLayer.googleMutant({
      type: 'hybrid' // valid values are 'roadmap', 'satellite', 'terrain' and 'hybrid'
    });

    var terrain = L.gridLayer.googleMutant({
      type: 'terrain' // valid values are 'roadmap', 'satellite', 'terrain' and 'hybrid'
    });
    
    let baseLayers = {   
      "แผนที่ถนน": roads,
      "แผนที่ภาพดาวเทียม": satellite,
      "แผนที่ผสม": hybrid.addTo(this.map),
      "แผนที่ภูมิประเทศ": terrain,
    };        
    L.control.layers(baseLayers).addTo(this.map);

    this.showLocation();
  }

  showLocation() {  
    let loading = this.loadingCtrl.create({
      content: 'Please wait...'
    });
    loading.present();
    
    this.geolocation.getCurrentPosition().then((res) => {      
      this.lat = res.coords.latitude;
      this.lon = res.coords.longitude;
      // resp.coords.longitude
      //let pos=[res.coords.latitude, res.coords.longitude]; 
      
      this.pos=[res.coords.latitude, res.coords.longitude];
      //let pos = [res.coords.latitude, res.coords.longitude];
      this.map.setView(this.pos, 16);
      this.marker = L.marker(this.pos, {draggable: true}).addTo(this.map);
      loading.dismiss();

      // drage marker
      this.marker.on("dragend", function (e) {
        this.pos = [e.target._latlng.lat, e.target._latlng.lng];          
      });
     }).catch((error) => {
       console.log('Error getting location', error);
     });      
  }

  takePicture() {
    const camOpt: CameraOptions={
      quality: 50,
      destinationType: this.camera.DestinationType.FILE_URI,
      sourceType: this.camera.PictureSourceType.CAMERA,
      encodingType: this.camera.EncodingType.JPEG,
      correctOrientation: true
    }    
    this.camera.getPicture(camOpt).then((imageData) => {
        this.imageName = imageData;
        this.imageFile=imageData.substr(imageData.lastIndexOf('/') + 1);
      }, (err) => {
        console.log(err);
      });
  }

  sendData() {
    let loader = this.loadingCtrl.create({content: "กำลังบันทึกข้อมูล.."});    
    let fplace = this.reportForm.controls['fplace'].value; 
    let fdesc = this.reportForm.controls['fdesc'].value;   
    let fname = this.reportForm.controls['fname'].value;
    let lat = this.lat;
    let lon = this.lon;
    let img64 = this.imageFile;

    let data = JSON.stringify({
      'lat': lat,
      'lon': lon,
      'fplace': fplace,
      'fdesc': fdesc,
      'fname': fname,
      'img': img64
    });

    console.log(data);
        
    loader.present();    
    this.http.post('https://www.gistnu.com/service/pinmap_survey_report.php', data)
    .subscribe(res => {      
      // loader.dismiss(); 
      // this.resetForm();      
      // let alert=this.alertCtrl.create({
      //   title: 'ส่งข้อมูลสำเร็จ!',
      //   subTitle: 'ข้อมูลของคุณถูกส่งเข้าสู่ระบบเรียบร้อยแล้ว',
      //   buttons:['ok']
      // });
      // alert.present();
    }, error => {
      console.log("Oooops!");
      loader.dismiss();
    });

    //upload image
    const fileTransfer: FileTransferObject = this.transfer.create();
    let options: FileUploadOptions = {
      fileKey: 'file',
      fileName: this.imageFile,      
      chunkedMode: false,
      mimeType: "image/jpeg",
      headers: {}
    }
  
    fileTransfer.upload(this.imageName, 'https://www.gistnu.com/service/pinmap_survey_upload.php', options)
    .then(res => {   
      loader.dismiss(); 
      this.resetForm();      
      let alert=this.alertCtrl.create({
        title: 'ส่งข้อมูลสำเร็จ!',
        subTitle: 'ข้อมูลของคุณถูกส่งเข้าสู่ระบบเรียบร้อยแล้ว',
        buttons:['ok']
      });
      alert.present(); 
    }, (err) => {
      loader.dismiss();
    });
  }  
   
  resetForm() {
    this.reportForm.reset();
    this.imageName='';
  }

  gotoReport1(){
    this.navCtrl.push(ReportPage, {
      pos: this.pos
    })
  }

  gotoReport(){
    const modalLeg: Modal =  this.modalCtrl.create('ReportPage',{
      lat: this.pos[0],
      lon: this.pos[1]
    });
    modalLeg.present();
  }

}
