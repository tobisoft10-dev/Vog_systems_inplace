const fs = require('fs');

// 1. Fix SiparisRepository.cs
const repoPath = 'D:\\bsipdev\\src\\BSip\\Repository\\SiparisRepository.cs';
const repoCode = `using System;
using System.Linq;
using BSip.Model;
using BSip.ViewModel;

namespace BSip.Repository
{
	public class SiparisRepository : Buran.Library2.Repository<BSip.Model.Siparis>
	{
		public SiparisRepository(BSip.Model.ModelContext context) : base(context)
		{
		}

		public IQueryable<SiparisListVideModel> GetListByIslemId(int islemId)
		{
			return base.GetList(d => !d.Islem.Tamamlandi && d.SiparisIslemPlanlari.Any(p => p.IslemId == islemId)).Select(d => new SiparisListVideModel
			{
				Beden = d.Beden,
				BedenId = d.BedenId,
				Detay1 = d.Detay1,
				Detay2 = d.Detay2,
				Detay3 = d.Detay3,
				Detay4 = d.Detay4,
				Detay5 = d.Detay5,
				Id = d.Id,
				Islem = d.Islem,
				IslemId = d.IslemId,
				KaliteKontrol = d.KaliteKontrol,
				Model = d.Model,
				Musteri = d.Musteri,
				MusteriId = d.MusteriId,
				Not = d.Not,
				Personel = d.Personel,
				PersonelId = d.PersonelId,
				TeslimZaman = d.TeslimZaman,
				Zaman = d.Zaman,
				Muhasebelesti = d.Muhasebelesti
			});
		}

		public IQueryable<SiparisListVideModel> GetList2()
		{
			return base.GetList(null).Select(d => new SiparisListVideModel
			{
				Beden = d.Beden,
				BedenId = d.BedenId,
				Detay1 = d.Detay1,
				Detay2 = d.Detay2,
				Detay3 = d.Detay3,
				Detay4 = d.Detay4,
				Detay5 = d.Detay5,
				Id = d.Id,
				Islem = d.Islem,
				IslemId = d.IslemId,
				KaliteKontrol = d.KaliteKontrol,
				Model = d.Model,
				Musteri = d.Musteri,
				MusteriId = d.MusteriId,
				Not = d.Not,
				Personel = d.Personel,
				PersonelId = d.PersonelId,
				TeslimZaman = d.TeslimZaman,
				Zaman = d.Zaman,
				Muhasebelesti = d.Muhasebelesti
			});
		}
	}
}
`;
fs.writeFileSync(repoPath, repoCode, 'utf8');
console.log('✅ SiparisRepository.cs fixed!');

// 2. Fix frmSiparisEditor.cs
const ed1Path = 'D:\\bsipdev\\src\\BSip\\UI\\Siparis\\frmSiparisEditor.cs';
let ed1Content = fs.readFileSync(ed1Path, 'utf8');
ed1Content = ed1Content.replace(/private Islem _ilkIslem;/g, 'private BSip.Model.Islem _ilkIslem;');
fs.writeFileSync(ed1Path, ed1Content, 'utf8');
console.log('✅ frmSiparisEditor.cs fixed!');

// 3. Fix frmSiparisEditor2.cs
const ed2Path = 'D:\\bsipdev\\src\\BSip\\UI\\Siparis\\frmSiparisEditor2.cs';
let ed2Content = fs.readFileSync(ed2Path, 'utf8');
ed2Content = ed2Content.replace(/private Islem _ilkIslem;/g, 'private BSip.Model.Islem _ilkIslem;');
fs.writeFileSync(ed2Path, ed2Content, 'utf8');
console.log('✅ frmSiparisEditor2.cs fixed!');
