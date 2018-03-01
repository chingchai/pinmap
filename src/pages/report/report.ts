import { Component } from '@angular/core';
import { IonicPage, NavParams, ViewController, LoadingController, AlertController, ModalController } from 'ionic-angular';
import { HttpClient } from '@angular/common/http';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';

@IonicPage()
@Component({
  selector: 'page-report',
  templateUrl: 'report.html',
})
export class ReportPage {
  public pos: any;  
  public lat: number;
  public lon: number;
  public usrData: any;

  public reportForm : FormGroup;
  public fplace : FormControl;
  public fdesc : FormControl;
  public fname : FormControl;
  public imageName:any;
  public imageFile:any;

  constructor(
    private transfer: FileTransfer,
    public fb : FormBuilder,  
    private camera : Camera, 
    public navParams: NavParams, 
    private loadingCtrl : LoadingController,
    private alertCtrl: AlertController,
    public modalCtrl: ModalController,
    public viewCtrl: ViewController,
    public http: HttpClient
  ) {
    this.lat = navParams.get('lat');
    this.lon = navParams.get('lon');
    this.fplace = fb.control('', Validators.required);
    this.fname = fb.control('', Validators.required);
    this.fdesc = fb.control('');
    this.reportForm = fb.group({ 
      'fplace': this.fplace,
      'fname': this.fname,
      'fdesc': this.fdesc, 
    })
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ReportPage');
    console.log(this.pos);

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
    this.http.post('https://www.gistnu.com/service/ltax_survey_report.php', data)
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
  
    fileTransfer.upload(this.imageName, 'https://www.gistnu.com/service/ltax_survey_upload.php', options)
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

  closeModal(){
    this.viewCtrl.dismiss();
  }

}
