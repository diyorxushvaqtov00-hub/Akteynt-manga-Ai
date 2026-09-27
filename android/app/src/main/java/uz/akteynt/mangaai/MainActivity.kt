package uz.akteynt.mangaai

import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(savedInstanceState); setContent { MangaAiApp() } }
}

@Composable
private fun MangaAiApp() {
    var uri by remember { mutableStateOf<Uri?>(null) }
    var message by remember { mutableStateOf("PDF bobni tanlang") }
    var progress by remember { mutableIntStateOf(0) }
    var busy by remember { mutableStateOf(false) }
    var jobId by remember { mutableStateOf<String?>(null) }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri = it }
    val api = remember { ApiClient(Config.API_BASE_URL) }
    val jobs = remember { JobApi(Config.API_BASE_URL) }

    MaterialTheme {
        Surface(Modifier.fillMaxSize()) {
            Column(Modifier.fillMaxSize().padding(24.dp), horizontalAlignment=Alignment.CenterHorizontally, verticalArrangement=Arrangement.Center) {
                Text("Akteynt Manga AI", style=MaterialTheme.typography.headlineMedium)
                Spacer(Modifier.height(8.dp))
                Text("PDF → AI tarjima → tayyor manga")
                Spacer(Modifier.height(24.dp))
                Button(enabled=!busy, onClick={ picker.launch(arrayOf("application/pdf")) }) { Text("PDF tanlash") }
                Spacer(Modifier.height(10.dp))
                Text(if(uri==null) "Fayl tanlanmagan" else "PDF tanlandi")
                Spacer(Modifier.height(10.dp))
                Button(enabled=uri!=null && !busy, onClick={
                    val selected=uri ?: return@Button
                    if(Config.SUPABASE_PUBLISHABLE_KEY.isBlank()){ message="Build konfiguratsiyasida Supabase publishable key kerak"; return@Button }
                    busy=true; progress=0; message="Upload tayyorlanmoqda..."
                    scope.launch {
                        try {
                            val size=context.contentResolver.openAssetFileDescriptor(selected,"r")?.length ?: -1L
                            if(size<=0L || size>100L*1024L*1024L) error("PDF 100 MB dan oshmasligi kerak")
                            val name="chapter-"+System.currentTimeMillis()+".pdf"
                            val init=api.initUpload(name,size,"application/pdf")
                            message="PDF yuklanmoqda..."
                            api.uploadToStorage(context,selected,init.storagePath,Config.SUPABASE_PUBLISHABLE_KEY,Config.SUPABASE_URL)
                            api.finalizeUpload(init.jobId,name,init.storagePath)
                            jobId=init.jobId; message="Tarjima jarayoni boshlandi..."
                            while(true){
                                val s=jobs.get(init.jobId); progress=s.progress
                                if(s.status=="completed"){message="Tarjima tugadi";break}
                                if(s.status=="failed") error(s.error ?: "Tarjima xatosi")
                                delay(2000)
                            }
                        } catch(e:Exception){message="Xato: "+(e.message ?: "noma'lum xato")} finally{busy=false}
                    }
                }) { Text("Tarjimaga yuborish") }
                Spacer(Modifier.height(18.dp))
                if(busy) LinearProgressIndicator(progress={progress/100f},modifier=Modifier.fillMaxWidth())
                Spacer(Modifier.height(8.dp))
                Text("$progress%")
                Text(message)
                jobId?.let { Text("Job: $it") }
            }
        }
    }
}
