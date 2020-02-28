import React, { Component } from 'react'
import { View, Text, Image, StyleSheet, Alert, BackHandler,TouchableOpacity, Picker, TextInput, ActivityIndicator, ToastAndroid } from 'react-native'
import ImagePicker from 'react-native-image-picker'
import deviceStorage from '../services/deviceStorage';
import AsyncStorage from '@react-native-community/async-storage';
import Geolocation from 'react-native-geolocation-service';
import Geocoder from 'react-native-geocoding';
import { CommonActions } from '@react-navigation/native';
import axios from 'axios';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {ApiMaps} from '../config/apiKey'
import { connect } from 'react-redux';
import { addStatusClockin, addLoading } from '../actions/DataActions';

 class WorkHome extends Component {
      constructor(props){
        super(props);
        this.state = {
            idUser : '',
            loadingPhoto: false,
            Location: '',
            photo: null,
            urlphoto:'',
            clockInstatus: false,
            statusCheckInn: 'You have clocked in!',
            message:'',
            status: 'Work at Home',
            scrumMaster: '',
            projectName: '',
            url: 'https://absensiapiendpoint.azurewebsites.net/api/WorkFromHome'
          }
        this.findCoordinates = this.findCoordinates.bind(this);
        this.handleChoosePhoto = this.handleChoosePhoto.bind(this);
        this.handleChangeMessage = this.handleChangeMessage.bind(this);
        this.submitAll = this.submitAll.bind(this);
        this.onBack = this.onBack.bind(this);
    }

    componentDidMount(){
      // alert(this.props.clockin_status)
      this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.onBack);
      this.findCoordinates()
    }
    componentWillUnmount() {
        this.watchID != null && Geolocation.clearWatch(this.watchID);
        this.backHandler.remove();
    }

    onBack = () => {
      this.props.navigation.goBack();
      return true;
   };
    
      handleChoosePhoto = () => {
        var options = {
          title: 'Select Image',
          storageOptions: {
            skipBackup: true,
            path: 'images',
          },
        };
        ImagePicker.showImagePicker(options, response => {
          if (response.uri) {
            console.log(response)
            this.setState({ 
              loadingPhoto: true 
            })
            var url = 'https://absensiapiendpoint.azurewebsites.net/api/BlobStorage/InsertFile';
            const Header = {
              // 'Content-Type': 'multipart/form-data',
              // 'accept' : 'text/plain'
            }       
            var formData = new FormData();
            formData.append('stream', {
              uri: response.uri,
              name: response.fileName,
              type: response.type
            })
            axios.post(url, formData ,Header)
              .then(data => {
                this.setState({
                  urlphoto : data.data,
                  photo: response,
                  loadingPhoto: false
                })
                ToastAndroid.showWithGravity(
                  'Upload success!',
                  ToastAndroid.SHORT,
                  ToastAndroid.BOTTOM,
                );
                console.log("ulrnya : " + this.state.urlphoto)
                }).catch(err => {
                  ToastAndroid.showWithGravity(
                    'Upload fail!',
                    ToastAndroid.SHORT,
                    ToastAndroid.BOTTOM,
                  );
                    console.log(err)
                    this.setState({
                      loadingPhoto: false
                    })
                  }
                )
              }
            })        
      }

      async submitAll(){
        const value = await AsyncStorage.getItem('clockin_state2');
        if(this.props.clockin_status === false || value === 'clockin'){
          alert('kamu sudah clock in hari ini');
        }
        else if(this.state.scrumMaster === '' || this.state.urlphoto === '' || this.state.projectName === ''){
          alert('Semua form dan foto harus terisi!');
        }
        else if(this.state.scrumMaster !== '' && this.state.urlphoto !== '' && this.state.projectName !== '' && this.props.clockin_status === true){
          axios({
            method: 'POST',
            url: this.state.url,
            headers: {
              accept: '*/*',
              'Content-Type': 'application/json',
            },
            data: {
              username: this.props.nameUser,
              name: this.props.namee,
              checkIn: new Date(),
              state: this.state.status,
              photo : this.state.urlphoto,
              location : this.props.userLocation,
              note : this.state.message,
              projectName : this.state.projectName,
              approval : 'pending',
              headDivision : this.state.scrumMaster
            }
          }).then((response) => {
            console.log(response)
            this.setState({
              statusCheckIn: 'You have clocked in!',
              idUser: response.data.idWFH,
            });
            deviceStorage.saveItem("clockin_state", "clockin");
            deviceStorage.saveItem("id_user", JSON.stringify(this.state.idUser));
            this.props.addClockin(this.state.clockInstatus, this.state.statusCheckInn, this.state.idUser, this.state.status)
            this.props.addLoad(true)
            ToastAndroid.showWithGravity(
              'Clock in success',
              ToastAndroid.SHORT,
              ToastAndroid.BOTTOM,
            );
            this.props.navigation.dispatch(
              CommonActions.reset({
                index: 1,
                routes: [
                  { name: 'Home' },
                ],
              })
            )
          })
          .catch((errorr) => {
            alert(errorr)
        });     
      }
    }

      findCoordinates = () => {
        Geolocation.getCurrentPosition(
          position => {
            Geocoder.init(ApiMaps);
            Geocoder.from(position.coords.latitude, position.coords.longitude)
              .then(json => {
                console.log(json);
                var addressComponent = json.results[1].address_components[0].long_name;
                  this.setState({
                    Location: addressComponent
                  })
                  console.log(addressComponent);
              })
            .catch(error => console.warn(error));
          },
          error => Alert.alert(error.message),
          { enableHighAccuracy: true, timeout: 50000, maximumAge: 1000 }
        );
	  };
    
    handleChangeMessage = event => {
      this.setState({ message: event });
    };

      render() {
        const { photo } = this.state
        return (
          <View style={styles.container2}>
              <View style={styles.card}>
                  <View style={styles.Split}>
                     <View style={styles.split1}>
                       <Text style={styles.titleText}>Take picture as evidence</Text>
                       <Text style={styles.baseText}>* The picture should have your face in it</Text>
                       <Text style={styles.baseText}>* This data will be forwarded to your Scrum Master to be approved first</Text>
                       <View style={{flexDirection:'row'}}>
                        <View style={styles.viewIcon}>
                          <FontAwesome5 name='map-marker' size={30} color='#3366FF'/>       
                        </View>
                        <View style={styles.viewLocation}>
                          <Text style={styles.locText}>{this.state.Location}</Text>       
                        </View>
                      </View>  
                                 
                     </View>
                   <View style={styles.split2}>
                   <FontAwesome5 name='camera' size={40} color='#FFFFFF' style={{display: this.state.loadingPhoto === false ? 'flex' : 'none', marginBottom:'25%'}}/>       
                      {photo && (
                        <React.Fragment>
                        <Image
                            source={{ uri: photo.uri }}
                            style={styles.image}
                            />  
                        </React.Fragment>
                      )}
                      <View style={{marginBottom:'25%', display: this.state.loadingPhoto === true ? 'flex' : 'none'}}>
                          <ActivityIndicator color='white' size={'large'} animating={this.state.loadingPhoto}/>   
                      </View>            
                      <TouchableOpacity onPress={this.handleChoosePhoto} style={styles.buttonPhoto}>
                          <Text style={styles.textPhoto} >Take Picture</Text>
                      </TouchableOpacity>
                   </View>                 
                   </View>
              </View>

                <Text style={styles.textSM}>
                    Select Your Scrum Master *
                </Text>

                <View style={styles.viewPicker}>            
                  <Picker
                    mode={"dropdown"}
                    value={this.state.scrumMaster}
                    selectedValue={this.state.scrumMaster}
                    style={styles.picker}
                    onValueChange={(itemValue, itemIndex) =>
                      this.setState({scrumMaster: itemValue})
                    }>
                    <Picker.Item label="" value="" />
                    <Picker.Item label="Java" value="java" />
                    <Picker.Item label="JavaScript" value="js" />
                  </Picker>
                </View>

                <Text
                  style={styles.textSM}>
                    Project Name *
                </Text>
                <TextInput
                  style={styles.inputText}
                  onChangeText={text => this.setState({projectName: text})}
                  value={this.state.projectName}>
                </TextInput>

                <Text style={styles.textSM}>
                    Notes
                </Text>
                <TextInput
                    multiline={true}
                    placeholder="any message..." 
                    style={styles.textInput}
                    onChangeText={text => this.setState({message: text})}
                    value={this.state.message}>
                </TextInput>

                <TouchableOpacity onPress={this.submitAll} style={styles.buttonSubmit}>
                    <Text style={styles.textbtnSubmit} >CLOCK IN</Text>
                </TouchableOpacity>
          </View>
        )
      }
}

const styles = StyleSheet.create({
	card: {
		height: '26%', backgroundColor:'#FFFFFF', width:'100%'
  },
  container2:{
    flex: 1,
    backgroundColor:'#e5e5e5',
  },
  split1: {
    flex:3, paddingTop:15, paddingLeft:10
  },
	viewIcon: {
		alignItems:'flex-start', alignSelf:'flex-start', paddingTop:15,
	},
	viewLocation: {
		paddingTop:15, paddingLeft:15
  },
  boldText: {
    fontSize: 30,
    color: 'red',
  },
   Split:{
     flex: 1,
     flexDirection: 'row',
   },
   titleText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  baseText: {
    fontSize: 13,
  },
  locText:{
    fontSize: 20,
    textAlign:'left'
  },
  split2:{
    alignItems:'center', flex:2, backgroundColor:'#7C7C7C', justifyContent: 'flex-end'
  },
  image:{
    width: "100%", height: "85%"
  },
  buttonPhoto:{
    backgroundColor:'#E74C3C', alignItems:'center', width:'100%', height:'20%'
  },
  textPhoto:{
    color:'white', fontSize: 17, fontWeight:'bold', textAlign:'center',textAlignVertical: "center"
  },
  textSM:{
    marginTop: 16,
    paddingLeft:20,
    fontSize:16
  },
  viewPicker:{
    width:'80%', height:'6%', marginLeft:20, borderRadius:10, borderColor:'black', borderWidth:1, backgroundColor:'white'
  },
  picker:{
    height: '100%', width: '100%', borderWidth:20, borderColor:'black'
  },
  textInput:{
    height:160, borderColor: 'gray', textAlignVertical: 'top', borderWidth: 1, marginLeft:20, borderColor:'black', width:'80%', borderRadius:10, backgroundColor:'white', fontSize:20
  },
  buttonSubmit:{
    backgroundColor:'#1A446D', marginTop:30, alignItems:'center', width:'50%', height:'12%', alignSelf:'center', borderRadius:20
  },
  textbtnSubmit:{
    color:'white', fontSize: 29, fontWeight:'bold', textAlign:'center',textAlignVertical: "center", flex:1 
  },
  inputText:{
    textAlignVertical: 'top', borderWidth: 1, borderRadius:10, width:'80%', height:'6%', marginLeft:20, backgroundColor:'white', fontSize:20 
  },
});

const mapStateToPropsData = (state) => {
  console.log(state);
  return {
    tokenJWT: state.JwtReducer.jwt,
    nameUser: state.DataReducer.username,
    namee: state.DataReducer.fullname,
    userLocation: state.DataReducer.locations,
    clockin_status : state.DataReducer.clockIn,
    status_Checkin : state.DataReducer.statusCheckIn,
    id : state.DataReducer.id,
    workStatus :  state.DataReducer.workStatus
  }
}
const mapDispatchToPropsData = (dispatch) => {
  return {
    addLoad : (Loading) => dispatch(addLoading(Loading)),
    addClockin : (clockInstatus, statusCheckInn, idUser, status) => dispatch(addStatusClockin(clockInstatus, statusCheckInn, idUser, status))
  }
}

export default connect(mapStateToPropsData, mapDispatchToPropsData)(WorkHome)
